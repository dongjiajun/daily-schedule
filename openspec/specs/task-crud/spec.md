# Task CRUD（任务增删改查）

## Purpose
提供任务看板模块的核心数据操作能力——创建、查询、更新、删除任务，以及关联标签管理。后端通过 DDD 四层架构实现，API 契约定义在 `specs/openapi.yaml`。

## Requirements

### Requirement: 任务创建
系统 SHALL 支持用户创建任务，包含标题（必填）、描述（可选）、优先级（默认 MEDIUM）、截止日期（可选）、关联标签（可选）。任务创建后状态默认为 `TODO`。

- API: `POST /tasks`，请求体 `CreateTaskRequest: { title: string, description?: string, priority?: 'LOW'|'MEDIUM'|'HIGH'|'URGENT', dueDate?: string, tagIds?: number[] }`
- 响应: `TaskProfile: { id, title, description, status, priority, sortOrder, dueDate, tags[]?, createdAt, updatedAt }`
- DB: `INSERT INTO tasks (user_id, title, description, priority, due_date, sort_order) VALUES (...)`
- 标签关联: `INSERT INTO task_tags (task_id, tag_id) VALUES (...)`
- `sort_order` 初始值 SHALL 为该状态下最大 `sort_order + 1`

#### Scenario: 创建最简任务
- **WHEN** 用户提交 `{ title: "买水果" }`
- **THEN** 创建任务，status=`TODO`，priority=`MEDIUM`，`dueDate=null`，`tagIds=[]`
- **THEN** 返回 201 + TaskProfile

#### Scenario: 创建带完整信息的任务
- **WHEN** 用户提交 `{ title: "准备周报", description: "汇总本周进度", priority: "HIGH", dueDate: "2026-07-25", tagIds: [1, 2] }`
- **THEN** 创建任务，所有字段入库，task_tags 关联写入
- **THEN** 返回 201 + TaskProfile（含 tags 数组）

#### Scenario: 标题为空时拒绝
- **WHEN** 用户提交 `{ title: "" }` 或 `{ title: "  " }`
- **THEN** 返回 400，`{ code: 400, message: "任务标题不能为空" }`

### Requirement: 任务查询
系统 SHALL 支持按状态、优先级、标签 ID 过滤当前用户的任务列表。

- API: `GET /tasks?status=TODO&priority=HIGH&tagId=1`
- 所有过滤参数可选，不传时返回全部
- 数据隔离: 仅返回 `user_id` 匹配当前用户的任务
- 响应: `TaskProfile[]`，按 `sort_order ASC, created_at DESC` 排序

#### Scenario: 查询全部任务
- **WHEN** 用户 `GET /tasks`（无过滤参数）
- **THEN** 返回当前用户所有任务

#### Scenario: 按状态过滤
- **WHEN** 用户 `GET /tasks?status=TODO`
- **THEN** 仅返回 `status = 'TODO'` 的任务

#### Scenario: 多条件组合过滤
- **WHEN** 用户 `GET /tasks?status=IN_PROGRESS&priority=URGENT`
- **THEN** 返回同时满足两个条件的任务

#### Scenario: 按标签过滤
- **WHEN** 用户 `GET /tasks?tagId=3`
- **THEN** 返回关联了标签 ID=3 的任务（通过 task_tags 关联表 JOIN）

### Requirement: 任务更新
系统 SHALL 支持更新任务的标题、描述、优先级、截止日期、标签关联。

- API: `PUT /tasks/{id}`，请求体 `UpdateTaskRequest: { title?: string, description?: string, priority?: string, dueDate?: string, tagIds?: number[] }`
- 仅更新提供的字段（部分更新语义）
- 不存在或不属于当前用户的任务返回 404

#### Scenario: 部分更新标题
- **WHEN** 用户 `PUT /tasks/1` body `{ "title": "买水果和蔬菜" }`
- **THEN** 仅标题更新，其他字段不变
- **THEN** 返回 200 + 更新后的 TaskProfile

#### Scenario: 更新标签关联
- **WHEN** 用户 `PUT /tasks/1` body `{ "tagIds": [1, 3] }`
- **THEN** 删除旧的 task_tags 记录，插入新的标签关联

#### Scenario: 更新不存在的任务
- **WHEN** 用户 `PUT /tasks/999`
- **THEN** 返回 404，`{ code: 404, message: "任务不存在" }`

#### Scenario: 更新他人的任务
- **WHEN** 用户 A 尝试 `PUT /tasks/{userB的taskId}`
- **THEN** 返回 404（数据隔离，不暴露他人任务存在）

### Requirement: 任务删除
系统 SHALL 支持用户删除任务，同时级联删除关联的 task_tags。

- API: `DELETE /tasks/{id}`
- 级联: 删除 task 记录时同步删除 `task_tags` 中关联行

#### Scenario: 删除已有任务
- **WHEN** 用户 `DELETE /tasks/1`
- **THEN** 任务记录和关联的 task_tags 记录一并删除
- **THEN** 返回 204 No Content

#### Scenario: 删除不存在的任务
- **WHEN** 用户 `DELETE /tasks/999`
- **THEN** 返回 404

### Requirement: 数据库表结构
系统 SHALL 使用 Flyway V6 迁移创建 `tasks` 和 `task_tags` 表。

- `tasks` 表: `id BIGINT PK AUTO_INCREMENT`, `user_id BIGINT NOT NULL`, `title VARCHAR(200) NOT NULL`, `description TEXT`, `status VARCHAR(20) NOT NULL DEFAULT 'TODO'`, `priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'`, `sort_order INT NOT NULL DEFAULT 0`, `due_date DATE`, `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`, `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- 索引: `INDEX idx_tasks_user_status (user_id, status)`, `INDEX idx_tasks_user_priority (user_id, priority)`
- `task_tags` 表: `task_id BIGINT NOT NULL`, `tag_id BIGINT NOT NULL`, `PRIMARY KEY (task_id, tag_id)`

#### Scenario: Flyway 迁移执行
- **WHEN** 应用启动且 Flyway 检测到 V6 迁移脚本
- **THEN** `tasks` 和 `task_tags` 表自动创建
- **THEN** `flyway_schema_history` 记录 V6 已执行
