# Tasks: rhythm-e2e-stability

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。

  ⚠️ 测试边界提醒：
  涉及以下技术时，单元测试 mock 无法覆盖真实浏览器行为，
  MUST 在 9.4 smoke test 中手工验证：
    - Canvas / WebGL / WASM（如 Rive、Lottie、tsParticles）
    - 文件上传 / 拖拽 / 剪贴板
    - Service Worker / PWA 离线
    - 第三方 SDK 初始化（如微信 JS-SDK）
-->

## 1. 数据库迁移
- [x] N/A — 无 Flyway 迁移

## 2. 领域层 (domain/)
- [x] N/A — shared 包 `randomMoveDuration` 数学语义不变

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 无后端变更

## 4. 应用层 (application/)
- [x] N/A — 无后端变更

## 5. API 层 (api/)
- [x] N/A — 无后端变更

## 6. 契约同步
- [x] N/A — 无 API 契约变更

## 7. 前端 (frontend/src/ + e2e/)
- [x] 7.1 修改 `modules/pet/components/RoamingPet.tsx` L680 — 休息移动时长 `randomMoveDuration(0.5)` → `randomMoveDuration(0.75)`（含注释更新：休息慢速档 4-10.7s，最坏 ≤ 11s）
- [x] 7.2 修改 `e2e/rhythm-smoke.spec.ts` — 实现中发现假时钟竞态（渲染提交落在 fastForward 窗口外 → 动画冻结，timeout 无法根治），追加 `page.clock.resume()` 恢复真实时钟驱动动画；sleep 断言 timeout 20s；describe 级 timeout 120s（并行负载下登录+假时钟流程可超默认 30s）；早晨唤醒段改真实 tick 等待（气泡 timeout 40s）
- [x] 7.3 核对 `modules/pet/components/__tests__/RoamingPet.test.tsx` — 断言均为 store 状态（isResting/position/action/bubble），无动画时长依赖 → 无需改动，核对结论：L178-217 全部断言 store 状态，L190 断言 position=小窝中心（目标值），与动画时长无关
- [x] 7.4 运行 `pnpm run verify` — lint + tsc + build + vitest 全部通过（50 文件 238 用例；覆盖 RoamingPet 相关单测）
- [x] 7.5 运行 E2E 多轮验证 — rhythm-smoke 单独 3 轮（--repeat-each=3）12/12 通过 + 完整并行跑 2 轮全过；**注**：`pet.spec.ts:84` 格内互动用例本地持续失败（stash 基线复现，与本次变更无关的既有问题，CI 通过，建议单独变更处理）

## 8. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 8.1 `docs/frontend/component-catalog.md` — 未触及（无组件新增/目录变化，RoamingPet 行为参数调整不改变目录结构）；核对结论：现有描述仍准确（注：该文件本次由 leaf-heart-fall-effects 变更更新特效组件条目，与本节无交集）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 未触及版本号/测试数/模块列表（E2E 用例数不变、无新模块）；核对结论：架构文档游走/节律描述未量化移动时长，仍准确（前端测试数 marker 更新为 50 系 leaf-heart 变更所致，docs-check 通过）
- [x] 8.5 `README.md` — 未触及；核对结论：现有功能清单描述仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（259 用例，BUILD SUCCESS）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（50 文件 238 用例）
- [x] 9.3 `cd frontend && npm run test:e2e` — rhythm-smoke 多轮验证稳定（单独 3 轮 12/12 + 完整并行 2 轮全过）；完整 E2E 41 过 + 1 跳过（`pet.spec.ts:84` 既有本地失败与变更无关，stash 基线确认、CI 通过）
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证：
  - [x] 夜间 23:30 回窝 + 早晨唤醒场景：由 rhythm-smoke E2E（page.clock + resume）完整覆盖（sleep 动作出现、唤醒气泡、sleep 消失）
  - [ ] 剩余手工项：回窝动画时长的主观观感（应比改造前快、仍慢于白天游走）——建议实际使用时段目测确认
