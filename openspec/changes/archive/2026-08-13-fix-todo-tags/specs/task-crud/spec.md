# Task CRUD（任务增删改查）

> 参考: specs/openapi.yaml + docs/api/overview.md + docs/database/schema.md

## ADDED Requirements

无

## MODIFIED Requirements

### Requirement: 任务查询
系统 SHALL 支持按状态、优先级、标签 ID 过滤当前用户的任务列表。

- API: `GET /tasks?status=TODO&priority=HIGH&tagId=1`
- 所有过滤参数可选，不传时返回全部
- 数据隔离: 仅返回 `user_id` 匹配当前用户的任务
- 响应: `TaskProfile[]`，按 `sort_order ASC, created_at DESC` 排序
- 响应中每个 `TaskProfile.tags` SHALL 填充该任务实际关联的标签（`TagResponse` 数组: `id`/`name`/`color`），未关联任何标签时为 `[]`

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

#### Scenario: 列表响应包含关联标签
- **WHEN** 用户 `GET /tasks`，其中任务 A 关联标签 [1, 2]，任务 B 无标签
- **THEN** 任务 A 的 `tags` 为 `[{id:1,...}, {id:2,...}]`（含 name/color）
- **THEN** 任务 B 的 `tags` 为 `[]`

### Requirement: 任务更新
系统 SHALL 支持更新任务的标题、描述、优先级、截止日期、标签关联。

- API: `PUT /tasks/{id}`，请求体 `UpdateTaskRequest: { title?: string, description?: string, priority?: string, dueDate?: string, tagIds?: number[] }`
- 仅更新提供的字段（部分更新语义）
- 不存在或不属于当前用户的任务返回 404
- 响应 `TaskProfile.tags` SHALL 反映更新后的标签关联（与查询响应一致）

#### Scenario: 部分更新标题
- **WHEN** 用户 `PUT /tasks/1` body `{ "title": "买水果和蔬菜" }`
- **THEN** 仅标题更新，其他字段不变
- **THEN** 返回 200 + 更新后的 TaskProfile

#### Scenario: 更新标签关联
- **WHEN** 用户 `PUT /tasks/1` body `{ "tagIds": [1, 3] }`
- **THEN** 删除旧的 task_tags 记录，插入新的标签关联
- **THEN** 返回 200 + TaskProfile，`tags` 反映新关联 `[1, 3]`

#### Scenario: 更新不存在的任务
- **WHEN** 用户 `PUT /tasks/999`
- **THEN** 返回 404，`{ code: 404, message: "任务不存在" }`

#### Scenario: 更新他人的任务
- **WHEN** 用户 A 尝试 `PUT /tasks/{userB的taskId}`
- **THEN** 返回 404（数据隔离，不暴露他人任务存在）

## REMOVED Requirements

无

## RENAMED Requirements

无
