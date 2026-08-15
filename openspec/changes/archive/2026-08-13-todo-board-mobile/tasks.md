# Tasks: todo-board-mobile

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
-->

## 1. 数据库迁移
- [x] N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] N/A — 纯前端变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 纯前端变更

## 4. 应用层 (application/)
- [x] N/A — 纯前端变更

## 5. API 层 (api/)
- [x] N/A — 纯前端变更

## 6. 契约同步
- [x] N/A — 契约零变更（撤销复用既有 createTask + moveTask 端点），无需重生成 SDK

## 7. 前端 (frontend/src/)
- [x] 7.1 `useTasks.ts` 新增 `useDeleteTaskWithUndo()`：组合 useDeleteTask/useCreateTask/useMoveTask，导出 `deleteWithUndo(task)`（删除成功 → toast「任务已删除」+ 撤销 action → createTask 原字段+tagIds → moveTask 恢复原状态与 sortOrder；toast duration 延长至 8s）
- [x] 7.2 `TaskCard.tsx`：操作按钮移除 `opacity-0 group-hover:opacity-100`（常驻）；删除改走 deleteWithUndo、移除 `window.confirm`
- [x] 7.3 `TaskCard.tsx` 新增状态 Select（底部操作行左侧，触发项含状态图标+文字，与 TaskRow 同款；切换为 DONE 时 emitTaskCompleted）
- [x] 7.4 `TaskRow.tsx`：删除改走 deleteWithUndo、移除 `window.confirm`
- [x] 7.5 `BoardView.tsx`：task-drop 处理器同列早退（`task.status === newStatus` 时 return）
- [x] 7.6 更新 vitest：`TaskCard.test.tsx`（hover 断言 → 常驻断言 + 状态 Select 用例 + 删除走 toast）；`useTasks.test.ts` 补 deleteWithUndo 用例；如 TaskRow 有测试则同步
- [x] 7.7 Playwright E2E：新增/更新移动端视口用例（375×667 下按钮可见 + 状态下拉改列 + 删除出 toast 撤销）；运行 `npm run test:e2e` 全量通过

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 组件行为变更（TaskCard 按钮常驻/状态 Select、TaskRow 删除撤销）→ 更新描述；未触及 → 核对结论
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/领域模型变更 → 核对结论：现有描述已核对仍准确
- [x] 8.3 `docs/api/overview.md` — 无端点/契约变更 → 核对结论：现有描述已核对仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 无架构/测试规模变化 → 核对结论：现有描述已核对仍准确
- [x] 8.5 `README.md` — 无版本/功能清单变化 → 核对结论：现有描述已核对仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端无改动，核对通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 46 过 0 挂 1 跳过
- [x] 9.4 Smoke test — 由真实浏览器 E2E 覆盖（新增 4 个移动端/同列用例 + 既有 pet-events.spec 宠物联动）：
  - [x] 移动端视口（375×667）：卡片编辑/删除按钮直接可见，无 hover（todo-board-interaction.spec 新增用例）
  - [x] 移动端视口：卡片状态下拉切换 → 任务移列（新增用例）；宠物联动由既有 pet-events.spec 覆盖
  - [x] 删除任务 → 无原生 confirm 弹窗（dialog 事件监听断言）→ toast 带撤销 → 点击撤销任务恢复（新增用例）
  - [x] 桌面端：同列拖拽卡片 → 位置不变（A 仍在 B 上方断言）；跨列拖拽 → 正常移列（新增用例 + 既有拖拽用例）
