# Tasks: frontend-ui-texture-polish

## 1. 实施
- [x] 1.1 数据库迁移（N/A — 纯前端 UI 与原语打磨，无表/列变更）
- [x] 1.2 领域层 (domain/)（N/A — 无后端领域层变更）
- [x] 1.3 基础设施层 (infrastructure/)（N/A — 无后端基础设施层变更）
- [x] 1.4 应用层 (application/)（N/A — 无后端应用层变更）
- [x] 1.5 API 层 (api/)（N/A — 无后端 API 层变更）
- [x] 1.6 契约同步（N/A — `specs/openapi.yaml` 零变更）
- [x] 1.7a 前端底座与交互原语（`themes.css`、`holiday-themes.css`、`design-tokens.json`、`index.css`、`button.tsx`、`segmented.tsx`、`dialog.tsx`、`Sidebar.tsx`）+ 更新 `primitives.test.tsx` + 运行 `pnpm run ui:check`
- [x] 1.7b 日历主舞台打磨（`calendar.css`、`CalendarView.tsx`、`CalendarSidebar.tsx`）+ 验证中文表头/网格微框/搜索 `<Kbd>`
- [x] 1.7c 待办模块原语与质感收口（`TaskToolbar.tsx`、`TaskForm.tsx`、`TaskColumn.tsx`、`TaskCard.tsx`、`TaskRow.tsx`、`ListView.tsx`）+ 更新 `TaskCard.test.tsx` / `TaskColumn.test.tsx`
- [x] 1.7d 宠物空间陈列台打磨（`PetPage.tsx`、`PetStatus.tsx`、`FoodActionList.tsx`、`PetMenu.tsx`）+ 更新 `FoodActionList.test.tsx`

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 更新原语（`Segmented`/`Button`/`Dialog`）、待办（`TaskForm`/`TaskCard`）与宠物（`FoodActionList` `layout` / `PetPage` 陈列台）组件说明
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 现有描述已核对仍准确（无表/字段/领域模型变动）
- [x] 2.3 `docs/api/overview.md` — 现有描述已核对仍准确（无端点/契约变动）
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 已核对测试规模计数并更新 `AGENTS.md` 前端用例数（59 文件 318 用例）；无新增/修改模块结构
- [x] 2.5 `README.md` — 现有描述已核对仍准确（无版本号/功能清单大类变更）
- [x] 2.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 3. 全量验证
- [x] 3.1 `cd backend && mvn test` — 后端单元测试全部通过（354/354）
- [x] 3.2 `cd frontend && pnpm run verify`（含 `pnpm run ui:check`、`pnpm run lint`、`pnpm run build`、`pnpm run test`）+ `turbo run verify` 全量通过
- [x] 3.3 `pnpm run test:e2e`（`--workers=2`，70 通过 + 1 既有 skip）全量通过；`npx playwright test --grep '@visual' --update-snapshots=all` 刷新全部 30 张基线后再跑 `pnpm run test:visual` 确认 5/5 无抖动
- [x] 3.4 Smoke test — 真实前后端联合浏览器验证明暗主题、分段滑块、TaskForm Dialog + Radix Select 与 `/pet` 陈列台（0 控制台报错、0 请求失败）
- [x] 3.5 `pnpm run openspec:check` — OpenSpec 一致性 + 归档完整性通过

## Workflow follow-up
- `/opsx:verify` — 真实前端源码变更归档前必备（确认无 CRITICAL 缺陷）
- `/opsx:archive` — 用户确认并合入后归档（本次只做规划、实现与验证，不主动归档/提交/推送）
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived`
