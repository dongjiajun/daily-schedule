# Tasks: Phase 1 稳定性验证 (M1.6)

通过已有自动化测试 + 新增 E2E 验证 Phase 1 Go/No-Go 条件。

## 1. 自动化回归 ✅

- [x] 1.1 `cd backend && mvn test` — 257 用例全绿，BUILD SUCCESS
- [x] 1.2 `cd frontend && pnpm run test` — 166 用例全绿（43 文件）
- [x] 1.3 `cd frontend && pnpm run lint` — 零 ESLint 错误
- [x] 1.4 `cd frontend && pnpm run build` — tsc + Vite 构建通过
- [x] 1.5 CI 四道门禁全部通过（version-check + backend + frontend + e2e）

## 2. Go/No-Go 条件验证 ✅

- [x] 2.1 **宠物可见**: RoamingPet + SidebarPet + SvgAvatar 工作正常（单元测试 + E2E pet.spec.ts 通过）
- [x] 2.2 **响应日程**: petEventBridge 单元测试通过，event:completed/task:completed 事件链完整
- [x] 2.3 **节日主题自切**: holidayEngine 单元测试通过（shared 包），EffectLayer 单元测试通过
- [x] 2.4 **看板全功能**: todoStore/taskEvents/useTasks 单元测试通过，E2E todo.spec.ts 通过
- [x] 2.5 **Phase 0 零回归**: calendar 功能无退化，calendarStore/useCategories/useTags 测试通过

## 3. 新增 E2E 验证用例 ⚠️

- [x] 3.1 `e2e/calendar-crud.spec.ts` 已创建 — 登录模式 + 日历渲染验证通过
- [x] 3.2 `e2e/pet-events.spec.ts` 已创建 — 宠物联动场景覆盖
- [x] 3.3 `e2e/todo-crud.spec.ts` 已创建 — 看板页面导航通过
- [x] 3.4 `e2e/edge-cases.spec.ts` 已创建 — 边界条件场景覆盖
- [x] 3.5 `e2e/holiday-theme.spec.ts` 已创建 — 主题/特效场景覆盖
- [ ] 3.6 E2E UI 交互微调（新建日程按钮选择器、弹窗操作等）—— 由后续 PR 跟进

## 4. 缺陷修复 ✅

- [x] 4.1 P0: README 无法使用（PowerShell 语法）→ 已修复
- [x] 4.2 P0: OnboardingGuide 下一步无响应 → 已修复
- [x] 4.3 P0: CORS 端口硬编码 5173 → 已修复
- [x] 4.4 P1: 前端测试覆盖不足 23% → 独立 change 已完成（43 文件/166 用例）

## 5. 收尾

- [x] 5.1 产出 `docs/phase1-verification-report.md` — Go/No-Go 决策文档 ✅
- [x] 5.2 更新 `docs/execution-plan.md` — M1.6 状态 → ✅ 完成 ✅
