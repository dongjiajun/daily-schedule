# Design: 任务看板模块（Todo Kanban）

## Context
当前系统已有日历日程管理（calendar 模块）和宠物养成（pet 模块），架构上已具备模块注册中心（ModuleRegistry）、事件总线（EventBus）、DDD 四层后端。任务看板是第一个从零新建的业务模块，参考 pet 模块的 DDD 分层和前端模块注册模式。

**约束**:
- API 契约驱动: `specs/openapi.yaml` 是唯一真相源
- DDD 依赖方向: API → 应用 → 领域 ← 基础设施
- 所有业务表含 `user_id` 隔离
- 前端模块间仅通过 EventBus 通信
- Flyway V5 已由宠物模块占用，本次用 V6

## Goals / Non-Goals

**Goals:**
- 看板三列（TODO/IN_PROGRESS/DONE）+ 拖拽换列
- 列表视图 + 排序/筛选
- 任务 CRUD + 标签关联
- 宠物联动（task:completed → 宠物开心）
- 35+ 新测试（后端 20 + 前端 15）

**Non-Goals:**
- 子任务 / 检查清单（subtasks）
- 重复任务 / 周期性任务
- 任务评论 / 附件
- 任务与日程关联（从任务创建日程或反之）
- 全文搜索

## Decisions

### Decision 1: 拖拽方案 — HTML5 Drag & Drop
- **选择**: HTML5 原生 Drag & Drop API（`onDragStart` / `onDragOver` / `onDrop`）
- **理由**: 看板拖拽只需换列（垂直区域），不需要排序拖拽（跨任意位置），HTML5 DnD 完全够用。无需引入额外库（react-beautiful-dnd 已不再维护，dnd-kit 对简单场景过重）。
- **备选方案**: `@dnd-kit/core` — 更强大的排序能力，但看板换列不需要其复杂度，且增加 15KB bundle。

### Decision 2: 前端状态管理 — React Query + 轻量 Zustand
- **选择**: React Query 管理服务端数据（useTasks），Zustand 管理纯 UI 状态（viewMode）
- **理由**: 与现有 calendar 模块模式一致（useEvents + calendarStore）。任务列表天然适合 React Query 缓存策略。
- **备选方案**: 全部 Zustand — 需手动处理缓存失效/重新获取，增加复杂度。

### Decision 3: 排序存储 — sort_order 整数
- **选择**: `sort_order INT` 字段，拖拽时更新为新位置
- **理由**: 简单可靠，每列内按 sort_order 排序。新增时取 `MAX(sort_order) + 1`。换列时设为目标列末尾。
- **备选方案**: 用链表指针（prev_id）— 移动只需改 3 条记录，但查询需要递归/应用层排序，过于复杂。

### Decision 4: 任务标签 — 复用现有 tags 表
- **选择**: `task_tags` 关联表复用 `tags` 表（日历和任务共享标签）
- **理由**: 标签为用户级资源，跨模块复用符合"统一标签体系"的产品方向。`task_tags` 仅存储关联关系。
- **备选方案**: 任务独立标签 — 增加冗余，用户体验割裂。

## DDD Layer Design

### 领域层 (domain/task/)
| 文件 | 说明 |
|------|------|
| `Task.java` | 实体: id, userId, title, description, status (TaskStatus), priority (TaskPriority), sortOrder, dueDate, createdAt, updatedAt |
| `TaskStatus.java` | 枚举: TODO, IN_PROGRESS, DONE |
| `TaskPriority.java` | 枚举: LOW, MEDIUM, HIGH, URGENT |
| `TaskRepository.java` | 接口: findByUserId(userId, filter), save(task), update(task), delete(id), updateStatus(id, status, sortOrder) |
| `TaskDomainService.java` | 默认值填充: 新建时自动设 status=TODO、priority=MEDIUM、sortOrder=最大+1 |

### 基础设施层 (infrastructure/)
| 文件 | 说明 |
|------|------|
| `TaskPO.java` | MyBatis-Plus PO: `@TableName("tasks")`，字段映射 task_tags 用 `@TableField(exist=false)` 标注的 transient tags 集合 |
| `TaskMapper.java` | `BaseMapper<TaskPO>` + 自定义查询 `selectByFilter`（动态 SQL 按 status/priority/tagId 过滤） |
| `TaskTagPO.java` | `@TableName("task_tags")` 联合主键 |
| `TaskTagMapper.java` | `BaseMapper<TaskTagPO>` |
| `TaskRepositoryImpl.java` | 实现 `TaskRepository`，注入 TaskMapper + TaskTagMapper，级联处理标签关联 |
| `V6__create_task_tables.sql` | Flyway 迁移（DDL 见 Database Design 节） |

### 应用层 (application/todo/)
| 文件 | 说明 |
|------|------|
| `TodoApplicationService.java` | CRUD 编排 + 事务: createTask / updateTask / deleteTask / moveTask / listTasks |

事务边界:
- `createTask`: `@Transactional` — 插入 task + 批量插入 task_tags
- `updateTask`: `@Transactional` — 更新 task + 先删后插 task_tags
- `deleteTask`: `@Transactional` — 删除 task + 删除关联 task_tags
- `moveTask`: 仅更新 status + sort_order

### API 层 (api/)
| 文件 | 说明 |
|------|------|
| `TodoController.java` | 实现生成的 `TasksApi` 接口 |
| `TodoAssembler.java` | `TaskPO → TaskProfile`，含标签名称列表填充 |

### 前端 (frontend/src/modules/todo/)
```
modules/todo/
├── index.ts              # ModuleDefinition
├── routes.tsx             # lazy 路由: /todo → TodoPage
├── components/
│   ├── TodoPage.tsx       # 主页面: 工具栏 + 视图切换 + 看板/列表
│   ├── BoardView.tsx      # 三列看板 (Column → TaskCard[])
│   ├── TaskColumn.tsx     # 单列: 标题 + 计数 + TaskCard 列表 + 快速创建
│   ├── TaskCard.tsx       # 任务卡片: 标题/优先级/截止日期/标签 + 拖拽手柄
│   ├── ListView.tsx       # 列表视图: 排序控件 + 表格行
│   ├── TaskRow.tsx        # 列表行: 状态下拉框 + 信息 + 操作按钮
│   ├── TaskForm.tsx       # 创建/编辑表单 (Dialog)
│   └── TaskToolbar.tsx    # 顶部工具栏: 视图切换 + 筛选
├── hooks/
│   └── useTasks.ts        # React Query: useTasks(filters), useCreateTask, useUpdateTask, useDeleteTask, useMoveTask
├── store/
│   └── todoStore.ts       # Zustand: viewMode ('board'|'list'), filters (status/priority/tagId)
└── lib/
    └── taskEvents.ts      # EventBus emit 封装: emitTaskCompleted, emitTaskCreated
```

**路由**: `/todo` → TodoPage（看板+列表），通过 `moduleRegistry.register(todoModule)` 注册

**模块注册**:
```typescript
const todoModule: ModuleDefinition = {
  id: 'todo',
  name: '任务看板',
  icon: KanbanIcon,
  order: 20,
  routes: [...],
  stores: { todoStore },
  petActions: [
    { event: 'task:completed', reaction: 'happy' },
    { event: 'task:created', reaction: 'encourage' },
  ],
}
```

## API Design
在 `specs/openapi.yaml` 中新增 `Tags: [Tasks]` 分组：

| 操作 | 路径 | 请求/响应 Schema |
|------|------|-----------------|
| listTasks | `GET /tasks?status=&priority=&tagId=` | `TaskProfile[]` |
| createTask | `POST /tasks` | `CreateTaskRequest` → 201 `TaskProfile` |
| updateTask | `PUT /tasks/{id}` | `UpdateTaskRequest` → 200 `TaskProfile` |
| deleteTask | `DELETE /tasks/{id}` | 204 No Content |
| moveTask | `PATCH /tasks/{id}/move` | `MoveTaskRequest` → 200 `TaskProfile` |

Schema 定义:
- `TaskProfile`: `id: int64, title: string, description?: string, status: string, priority: string, sortOrder: int32, dueDate?: string, tags?: TagProfile[], createdAt: string, updatedAt: string`
- `CreateTaskRequest`: `title: string, description?: string, priority?: string, dueDate?: string, tagIds?: int64[]`
- `UpdateTaskRequest`: `title?: string, description?: string, priority?: string, dueDate?: string, tagIds?: int64[]`
- `MoveTaskRequest`: `status: string, sortOrder: int32`

错误码: 400 (参数校验), 404 (任务不存在), 500 (服务器错误)

## Database Design

### Flyway V6: `V6__create_task_tables.sql`

```sql
CREATE TABLE tasks (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  user_id     BIGINT       NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'TODO',
  priority    VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
  sort_order  INT          NOT NULL DEFAULT 0,
  due_date    DATE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tasks_user_status (user_id, status),
  INDEX idx_tasks_user_priority (user_id, priority),
  CONSTRAINT chk_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  CONSTRAINT chk_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

CREATE TABLE task_tags (
  task_id BIGINT NOT NULL,
  tag_id  BIGINT NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  INDEX idx_task_tags_tag (tag_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

**H2 测试兼容**: `schema-h2.sql` 需同步新增 `tasks` 和 `task_tags` 表（去掉 MySQL 特有语法如 `ON UPDATE CURRENT_TIMESTAMP`）。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Drag & Drop 在移动端体验差 | 移动端默认使用列表视图，看板仅在 `md` 及以上启用 |
| 大量任务时看板性能 | 每列虚拟滚动（现阶段 <200 任务无需担心） |
| 拖拽与 optimistic update 状态不一致 | React Query `onMutate` 保存快照，`onError` 回滚 |
| task_tags 与 tags 共享可能导致误删 | `ON DELETE CASCADE` 保证引用完整性 |

## Migration Plan

1. **部署步骤**:
   - 部署新版本后端（Flyway 自动执行 V6）
   - 部署新版本前端
   - 无需数据迁移（全新表）

2. **回滚策略**:
   - 前端: 在 ModuleRegistry 中跳过注册 todo 模块
   - 后端: Flyway 不支持自动回滚；V6 表不影响现有功能，可保留

3. **版本号**: 3.2.0 → 3.3.0（`specs/openapi.yaml` / `backend/pom.xml` / `frontend/package.json`）

## Open Questions
- 无
