# Proposal: 任务看板模块（Todo Kanban）

## Why
当前系统仅有日历日程管理，缺少轻量级任务管理能力。用户需要快速记录待办事项并通过看板视图追踪进度——这是"个人管理中心"的第二个核心模块（继宠物系统之后），也是验证模块化架构可扩展性的第一个新业务模块。完成日程产出"专注币 + 经验"，完成任务同样应产出养成资源，强化"宠物陪你一起成长"的情感驱动闭环。

## What Changes
- 新增 Flyway V6 迁移：`tasks` + `task_tags` 表
- 后端新增 `com.dailyschedule.todo.*` DDD 四层（~12 文件）
- OpenAPI 新增 `/tasks`、`/tasks/{id}`、`/tasks/{id}/move` 端点
- 前端新增 `modules/todo/` 模块（看板 + 列表视图、拖拽换列、CRUD、宠物联动）
- EventBus 新增 `task:completed` / `task:created` 事件（已预定义类型，补实现）
- `specs/openapi.yaml` 版本号升级至 v3.3.0

## Capabilities

### New Capabilities
- `task-crud`: 任务增删改查 — 标题、描述、优先级、截止日期、标签关联
- `task-board-view`: 看板视图 — 按状态分列（TODO / IN_PROGRESS / DONE），支持拖拽换列
- `task-list-view`: 列表视图 — 按优先级/截止日期排序，筛选
- `task-pet-bridge`: 任务宠物联动 — 完成任务触发宠物开心 + 掉落养成资源

### Modified Capabilities
- `event-bus`: 新增 `task:completed` / `task:created` 事件（类型已预定义，需补宠物消费逻辑）
- `pet-event-bridge`: 宠物监听 `task:completed` 事件，播放开心动画 + 产出资源

## API Contract Impact
需修改 `specs/openapi.yaml`，新增 5 个端点：

| 端点 | 说明 |
|------|------|
| `GET /tasks` | 查询任务列表（支持 status/priority/tagId 过滤） |
| `POST /tasks` | 创建任务 |
| `PUT /tasks/{id}` | 更新任务（含移动看板列） |
| `DELETE /tasks/{id}` | 删除任务 |
| `PATCH /tasks/{id}/move` | 拖拽移动任务到目标列/位置 |

新增 schema：`TaskProfile`、`CreateTaskRequest`、`UpdateTaskRequest`、`MoveTaskRequest`

版本号：3.2.0 → 3.3.0

## DDD Layer Impact
全部四层受影响（新增包 `com.dailyschedule.todo`）：

| 层 | 新增文件 |
|------|------|
| API | `TodoController`（实现生成的接口）、`TodoAssembler`（DTO↔Domain） |
| 应用 | `TodoApplicationService`（CRUD 编排 + 事件发布） |
| 领域 | `Task`（实体）、`TaskStatus`（枚举：TODO/IN_PROGRESS/DONE）、`TaskPriority`（枚举）、`TaskRepository`（接口）、`TaskDomainService` |
| 基础设施 | `TaskPO`、`TaskMapper`、`TaskRepositoryImpl`、`TaskTagPO`、`TaskTagMapper` |

## Database Impact
Flyway V6 迁移：`V6__create_task_tables.sql`

```sql
CREATE TABLE tasks (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'TODO',
  priority    VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
  sort_order  INT          NOT NULL DEFAULT 0,
  due_date    DATE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_user_status (user_id, status)
);

CREATE TABLE task_tags (
  task_id BIGINT NOT NULL,
  tag_id  BIGINT NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);
```

## Impact
- **后端**: 新增 `com.dailyschedule.todo.*` 包（~12 文件），不影响现有 calendar/pet 代码
- **前端**: 新增 `modules/todo/` 模块（~10 文件），通过 ModuleRegistry 注册，不修改核心基础设施
- **API 契约**: `specs/openapi.yaml` 新增 5 个端点 + 4 个 schema
- **EventBus**: `shared/src/eventBus.ts` 中 `task:completed` / `task:created` 类型已预定义，无需修改；仅需在 pet 模块中消费
- **依赖**: 无新增第三方依赖（前端拖拽用 HTML5 Drag & Drop API，无需额外库）
- **文档**: 需更新 `docs/api/overview.md`、`docs/database/schema.md`、`docs/frontend/component-catalog.md`、`docs/uml/README.md`
