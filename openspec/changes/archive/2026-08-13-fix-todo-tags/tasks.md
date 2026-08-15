# Tasks: fix-todo-tags

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
-->

## 1. 数据库迁移
- [x] N/A — 无数据库变更。`tasks`/`task_tags` 表已存在（Flyway V6），写入路径已实现，本变更仅新增只读 JOIN 查询，无新迁移脚本

## 2. 领域层 (domain/)
- [x] 2.1 `domain/task/Task` 新增 `List<Tag> tags` 字段（默认空列表，与 `domain/event/Event` 双字段模式对齐）+ getter/setter
- [x] 2.2 更新/补充领域层测试（如有 TaskTest，补 tags 字段用例）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 `TaskTagMapper` 新增 `selectTagsByTaskIds(Collection<Long> taskIds)`（`<script>` foreach IN + JOIN `tag` 表）+ 内部类 `TaskTagJoinRow`（对照 `EventTagMapper.EventTagJoinRow`）
- [x] 3.2 `TaskRepositoryImpl`：注入 `TagMapper`；新增私有 `loadWithTags(List<TaskPO>)`（空列表守卫 + 分组回填 `tags`/`tagIds`）；`findById`/`findByUserId` 改走 `loadWithTags`；`save`/`update` 返回前用 `TagMapper.selectBatchIds` 回填 `task.tags`
- [x] 3.3 编写基础设施层单元测试：`TaskRepositoryImplTest` 补标签加载（列表/单查）与 save/update 回填用例

## 4. 应用层 (application/)
- [x] N/A — `TodoApplicationService` 编排逻辑无变化

## 5. API 层 (api/)
- [x] 5.1 `TodoAssembler`：新增 `toDomain(CreateTaskRequest)` / `toDomain(UpdateTaskRequest)`（含 `TaskPriority.fromString` 与 tagIds 拷贝，参照 `EventAssembler.toDomain`）；`toTaskProfile(Task)` 改为从 `task.getTags()` 构建 TagResponse（参照 `EventAssembler.buildTagResponses`），移除 `Collections.emptyList()`
- [x] 5.2 `TodoAssembler` 删除两参重载 `toTaskProfile(Task, List<TagResponse>)`（删除前 grep 确认无调用者）
- [x] 5.3 `TodoController`：`createTask`/`updateTask` 改调 `TodoAssembler.toDomain`，删除手工 `new Task()` + 逐字段 set
- [x] 5.4 编写 API 层单元测试：新增 `TodoAssemblerTest`（toDomain 双请求类型 + toTaskProfile 含 tags/空 tags）；如有 TodoControllerTest 则同步更新

## 6. 契约同步
- [x] N/A — 契约零变更。`specs/openapi.yaml` 已声明 `TaskProfile.tags` 与 `tagIds`，无需改契约、无需重生成 SDK、无需同步版本号

## 7. 前端 (frontend/src/)
- [x] N/A — 前端零改动。`TaskCard`/`TaskRow` 已消费 `task.tags`（SDK 类型已含），修复后自然显示

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 无前端组件/目录变更 → 核对结论：现有描述已核对仍准确
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 表结构无变化（schema.md 核对）；**领域模型变更**：Task 新增 `tags`（List<Tag>）关联 → uml 已预写该设计，本次勘误 tagIds 类型为 List<Long>
- [x] 8.3 `docs/api/overview.md` — 端点/契约无变化，仅行为修复（tags 从恒空变为实际填充）→ 核对结论：现有描述已核对仍准确（如 overview.md 未涉及 tags 细节则无需修改）
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 架构无变化；测试规模变动：38 类 269 用例（两处声明同步更新）
- [x] 8.5 `README.md` — 无版本/功能清单变化 → 核对结论：现有描述已核对仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — 任务相关 spec 13/13 通过；全量 40 过 2 挂（rhythm-smoke 宠物节律 clock 注入，与本变更无关的既有不稳定）
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证（Playwright 驱动真实浏览器 11/11 通过）：
  - [x] 登录 → 任务看板创建带标签任务 → 卡片显示标签 chips
  - [x] 切换列表视图 → 任务行显示标签
  - [x] 编辑任务标签（增删）→ 保存后卡片/列表标签即时更新
  - [x] 无标签任务 → 不显示空标签占位
