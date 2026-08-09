# Tasks: fix-pet-cell-interaction-e2e

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
-->

## 1. 数据库迁移
- [x] N/A — 无 Flyway 迁移

## 2. 领域层 (domain/)
- [x] N/A — 产品代码零改动（夜间休息优先是既有设计，spec「Rest behavior takes precedence」）

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 无后端变更

## 4. 应用层 (application/)
- [x] N/A — 无后端变更

## 5. API 层 (api/)
- [x] N/A — 无后端变更

## 6. 契约同步
- [x] N/A — 无 API 契约变更

## 7. 前端 (frontend/src/ + e2e/)
- [x] 7.1 修改 `e2e/pet.spec.ts`「宠物进入日历格子 → 格内互动」用例 — 点击格子前调用 `page.clock.setFixedTime(new Date('2026-08-09T10:00:00'))`（固定白天 daytime 时段，仅固定 Date 不影响 timers），并加注释说明时段敏感根因（本地凌晨 night → 宠物回窝优先 → 格子点击吸引失效）
- [x] 7.2 核对 pet.spec 其余用例时段敏感性 — 核对结论：feed/eat/金币禁用等用例不涉及时段逻辑（宠物互动/商店行为无节律分支），无需固定时钟
- [x] 7.3 本地（当前凌晨时段）运行 `npx playwright test e2e/pet.spec.ts` — 修复前必失败（此前 5 连败含 stash 基线）、修复后 7/7 全部通过（:84 用时 36.4s）
- [x] 7.4 运行 `pnpm run verify` — lint + tsc + build + vitest 全部通过

## 8. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 8.1 `docs/frontend/component-catalog.md` — 未触及（无组件变化）；核对结论：现有描述仍准确
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 涉及 E2E 测试描述？→ 核对结论：E2E 用例数不变（11 文件）、版本号不变，仅测试内部时钟注入 → 现有描述仍准确
- [x] 8.5 `README.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（259 用例 BUILD SUCCESS；本会话早期验证，无后端变更）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（50 文件 238 用例）
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（42 过 + 1 跳过 + 0 失败；含 pet.spec:84 修复验证，本地凌晨时段跑，修复前必失败、修复后全绿）
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证：
  - [x] 白天时段点击日历格子 → 格内互动（pace + 贴壁旋转）：E2E 完整覆盖（36.4s 通过，含真实动画等待）
  - [x] 凌晨时段点击格子 → 夜间回窝优先：由 `determineMode` night 分支既有行为保证（spec「Rest behavior takes precedence」），且本会话早期凌晨实测（修复前）确认宠物不回格、去小窝——符合设计
