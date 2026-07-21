# Tasks: 任务看板模块（Todo Kanban）

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。

  ⚠️ 测试边界提醒：
  涉及以下技术时，单元测试 mock 无法覆盖真实浏览器行为，
  MUST 在 9.3 smoke test 中手工验证：
    - HTML5 Drag & Drop（拖拽换列）
    - react-hot-toast / sonner Toast 弹出
-->

## 1. 数据库迁移
- [x] 1.1 编写 V6__create_task_tables.sql（tasks + task_tags 表，含索引/约束/外键）
- [x] 1.2 更新 H2 测试 schema（schema-h2.sql，去 MySQL 特有语法）
- [x] 1.3 启动 local MySQL 验证 Flyway 迁移成功

## 2. 领域层 (domain/task/)
- [x] 2.1 新建 `TaskStatus` 枚举（TODO / IN_PROGRESS / DONE）
- [x] 2.2 新建 `TaskPriority` 枚举（LOW / MEDIUM / HIGH / URGENT）
- [x] 2.3 新建 `Task` 实体（id, userId, title, description, status, priority, sortOrder, dueDate, tagIds, createdAt, updatedAt）
- [x] 2.4 新建 `TaskRepository` 接口（findByUserId, save, update, delete, updateStatus）
- [x] 2.5 新建 `TaskDomainService`（新建任务默认值填充：status=TODO, priority=MEDIUM, sortOrder=最大+1）
- [x] 2.6 编写 Task 领域层单元测试

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 新建 `TaskPO`（MyBatis-Plus PO，@TableName("tasks")）
- [x] 3.2 新建 `TaskTagPO`（@TableName("task_tags")）
- [x] 3.3 新建 `TaskMapper`（BaseMapper + 自定义 @Select 动态过滤查询）
- [x] 3.4 新建 `TaskTagMapper`（BaseMapper）
- [x] 3.5 新建 `TaskRepositoryImpl`（实现 TaskRepository，级联 task_tags）
- [x] 3.6 编写基础设施层单元测试（TaskMapper + TaskRepositoryImpl）

## 4. 应用层 (application/todo/)
- [x] 4.1 新建 `TodoApplicationService`（createTask / updateTask / deleteTask / moveTask / listTasks，事务注解）
- [x] 4.2 编写应用层单元测试（TodoApplicationServiceTest）

## 5. API 层 (api/)
- [x] 5.1 新建 `TodoAssembler`（PO→TaskProfile DTO 转换，含标签名称填充）
- [x] 5.2 新建 `TodoController`（实现生成的 TasksApi 接口，含参数校验 + 404 处理）
- [x] 5.3 编写 API 层单元测试（TodoControllerTest）

## 6. 契约同步
- [x] 6.1 更新 specs/openapi.yaml（新增 /tasks 端点 + TaskProfile/CreateTaskRequest/UpdateTaskRequest/MoveTaskRequest schema）
- [x] 6.2 更新 specs/CHANGELOG.md（记录 v3.3.0 变更）
- [x] 6.3 同步版本号: pom.xml (3.2.0→3.3.0) + frontend/package.json (3.2.0→3.3.0) + openapi.yaml
- [x] 6.4 重新生成后端接口 (mvn compile — openapi-generator-maven-plugin)
- [x] 6.5 重新生成前端 SDK (npm run generate:api)

## 7. 前端 (frontend/src/modules/todo/)
- [x] 7.1 新建 `todoStore.ts`（Zustand: viewMode, filters）
- [x] 7.2 新建 `useTasks.ts`（React Query: useTasks(filters), useCreateTask, useUpdateTask, useDeleteTask, useMoveTask — 全部 unwrap）
- [x] 7.3 新建 `TaskCard.tsx`（卡片: 标题/优先级标签(彩色)/截止日期(逾期红)/标签 chips + 拖拽 handle）
- [x] 7.4 新建 `TaskColumn.tsx`（单列: 标题 + 数量徽章 + TaskCard 列表 + "+ 新建"按钮 + drop 区域高亮）
- [x] 7.5 新建 `BoardView.tsx`（三列布局: TODO | IN_PROGRESS | DONE，拖拽跨列移动）
- [x] 7.6 新建 `TaskRow.tsx`（列表行: 状态下拉框 + 信息 + 操作按钮）
- [x] 7.7 新建 `ListView.tsx`（列表: 排序控件 + 筛选 + 行列表）
- [x] 7.8 新建 `TaskForm.tsx`（创建/编辑 Dialog: 标题/描述/优先级/截止日期/标签选择）
- [x] 7.9 新建 `TaskToolbar.tsx`（工具栏: 视图切换按钮 + 筛选下拉）
- [x] 7.10 新建 `TodoPage.tsx`（主页面: TaskToolbar + BoardView/ListView 条件渲染）
- [x] 7.11 新建 `routes.tsx`（lazy 路由: /todo → TodoPage）
- [x] 7.12 新建 `index.ts`（ModuleDefinition 导出: id=todo, name=任务看板, order=20, routes, petActions）
- [x] 7.13 新建 `lib/taskEvents.ts`（EventBus emit 封装: emitTaskCompleted, emitTaskCreated）
- [x] 7.14 在 main.tsx 中注册 `todoModule` 到 moduleRegistry
- [x] 7.15 在宠物模块 `registerPetEventListeners()` 中新增 `task:completed` 和 `task:created` 监听
- [x] 7.16 编写前端测试（todoStore 单测 + taskEvents 测试）（todoStore 单测 + useTasks hooks 测试 + TaskCard/TaskColumn/BoardView 组件渲染测试）

## 8. 文档同步
- [x] 8.1 新前端组件 → 更新 `docs/frontend/component-catalog.md`
- [x] 8.2 新实体/表/字段 → 更新 `docs/database/schema.md` + `docs/uml/README.md`
- [x] 8.3 新 API 端点 → 更新 `docs/api/overview.md`
- [x] 8.4 架构/模块变动 → 更新 `docs/architecture.md` + `CLAUDE.md`

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过 (257 tests)
- [x] 9.2 `cd frontend && pnpm run verify` — lint + tsc + build + test 全部通过 (84 tests)
- [ ] 9.3 Smoke test — 启动前后端，浏览器验证关键路径：
  - [ ] 登录 → 点击"任务看板"导航 → 看板三列显示
  - [ ] 在 TODO 列点击"+ 新建" → 输入标题回车 → 任务卡片出现在 TODO 列
  - [ ] 拖拽任务卡片从 TODO 到 IN_PROGRESS → 卡片移动成功
  - [ ] 拖拽任务卡片到 DONE → 宠物播放开心动画 + 气泡消息
  - [ ] 切换到列表视图 → 任务按行显示 → 状态下拉框切换成功
  - [ ] 创建带截止日期和标签的任务 → 编辑 → 删除
