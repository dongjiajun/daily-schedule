# Tasks: pet-cell-physics-v2

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 变更

## 6. 契约同步
- [x] 6.1 N/A — 无契约变更

## 7. 前端 (frontend/src/ + packages/shared)
- [x] 7.1 `cellPhysics.ts` 路径改造 — `cellEdges` 增加四角转角点（14 点顺时针：底→右下角→右→右上角→顶→左上角→左→左下角）；新增 `landSnap`（enter 落地吸附）、`slideInSpeed`（吸附滑入速度）；`cellSessionDuration` 改为圈数 + 25s 兜底
- [x] 7.2 `RoamingPet.tsx` 状态机修正 — cling 移除 `applyGravity`（贴边停留不漂移）；enter 落向最近底边吸附点 + 重力下落 + 落定弹跳；walk 到达概率分流（40% hop / 30% 短暂 cling 300-600ms / 30% 续走）；`lapAnchor` 1.5 圈退出；`setClingEdge` 时序与移动方向一致 + 旋转 0.15s transition
- [x] 7.3 更新 `cellPhysics.test.ts`（14 点/四角顺序/滑入/落地/圈数）+ `RoamingPet.test.tsx`（cling 不漂移/顶边可达/概率分流）
- [x] 7.4 重建 shared dist（`pnpm --filter @daily-schedule/shared run build`）
- [x] 7.5 E2E 核对 — `e2e/pet.spec.ts` 既有场景（月视图共存等）保持通过；格内物理视觉行为由 9.4 smoke 验证

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — RoamingPet 格内状态机描述更新（连续绕边/吸附滑入/圈数退出）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 现有描述已核对仍准确（无表/模型变更）
- [x] 8.3 `docs/api/overview.md` — 现有描述已核对仍准确（无端点变更）
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 宠物能力描述同步（格内物理行为修正）
- [x] 8.5 `README.md` — 现有描述已核对仍准确（版本/功能清单未变）
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 N/A — 后端零改动（CI 覆盖）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（需先起前后端）
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证格内物理体验：
  - [x] 宠物进入月视图格子 → 沿四边连续绕行（含顶边，转角平滑，无斜线穿越）
  - [x] 顶边/侧边停留不漂移（不再被重力拖向底部）
  - [x] 接近吸附点有加速滑入 + 落定感；enter 落地有重力下落 + 小弹跳
  - [x] 绕完 2 圈自然退出恢复游走（不再中途突然消失）
  - [x] 贴左/右壁时形象横过来（rotate ±90°），与移动方向一致
