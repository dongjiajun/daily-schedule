# Tasks: pet-cell-physics

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  格内物理场：贴边行走 + 重力 + 吸附 + 跳跃（替换左右横移 timer）。
  纯前端变更（后端/契约/DB 均不触碰）；归档前必须执行 /opsx:verify。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端领域层变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施层变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无后端 API 层变更

## 6. 契约同步
- [x] 6.1 N/A — 无 API 契约变更（openapi.yaml 不改）
- [x] 6.2 N/A — 无契约变更，无需 CHANGELOG 条目
- [x] 6.3 N/A — 版本号不动（维持 3.3.4）
- [x] 6.4 N/A — 无契约变更，无需 mvn compile 重新生成
- [x] 6.5 N/A — 无契约变更，无需 generate:api

## 7. 前端 (frontend/src/ + packages/shared/)
- [x] 7.1 `packages/shared/src/pet/cellPhysics.ts`（新增，纯函数零依赖）：
  - `cellEdges(rect, margin)` — 四边吸附点采样（上 3 / 下 3 / 左 2 / 右 2，共 10 点，均匀分布）
  - `nextClingPoint(current, edges, visited)` — 绕边不回头：最近未访问吸附点
  - `snapToEdge(pos, edges, threshold)` — 距吸附点阈值内吸附到边线
  - `hopOffset(t, duration, height)` — sin 抛物线跳跃偏移
  - `createCellStyle(completion)` — 风格配置（≥50: walkSpeed 60/hopChance 0.4/cling 0.6-1.2/bottomOnly false/emotion happy；<50: 25/0/1.2-2/true/idle_variant）
  - `createDefaultConfig` 导出到 `packages/shared/src/pet/index.ts`
- [x] 7.2 编写 shared 单测（`cellPhysics.test.ts`）：edges 采样数量与边界、nextClingPoint 绕边不回头、snapToEdge 吸附、hopOffset 曲线（t=0/0.5/1）、createCellStyle 双风格参数
- [x] 7.3 `RoamingPet.tsx` 格内状态机（替换 `startPacing`/`stopPacing` timer 链）：
  - `startCellPhysics(zone)`：rAF 帧循环 + 状态机（enter → cling → walk → cling → hop → … → exit）+ `setAction('pace')` + 游走 tick 暂停
  - 状态推进：walk 按 `nextClingPoint` 匀速移动（帧 lerp）；cling 吸附落定 + 停留（快 0.6-1.2s / 慢 1.2-2s）；hop 按风格概率触发（`setAction('jump')` + `hopOffset` 0.6s）
  - 退出：离开格子（position 出 rect）/ 状态机超时（快 10s / 慢 15s）/ 组件卸载 → cancel rAF + 恢复游走
  - 移除 `pacingTimerRef`/`pacingDirRef`/`lastPacedCellRef` 旧逻辑（保留进入边沿判定）
- [x] 7.4 更新/编写 RoamingPet 测试：进格启动 rAF（mock rAF 推进状态机断言 position 沿边变化）、超时强制退出、离开格子恢复游走、快慢风格参数断言；更新既有格内往返测试（左右横移断言改为贴边断言）
- [x] 7.5 更新 Playwright E2E（`e2e/pet-events.spec.ts` 或 pet.spec）：格内互动存在性冒烟（宠物在月视图格子内时 data-action 为 pace/walk）——物理动画为视觉行为，E2E 只做状态存在性

## 8. 文档同步（逐项评估——未触及的文档类别也必须写明"现有描述已核对仍准确"）
- [x] 8.1 `docs/frontend/component-catalog.md` — RoamingPet 格内互动描述更新（贴边/重力/吸附/跳跃替换"左右往返"）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；现有描述已核对仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及；现有描述已核对仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 未触及架构/模块结构；测试数核对（shared 新增测试文件/用例数以实测更新 marker）
- [x] 8.5 `README.md` — 未触及；现有描述已核对仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端 37 类 259 用例回归通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest（47 文件 211 用例）全部通过
- [x] 9.3 `npm run test:e2e` — Playwright E2E 37 通过 + 1 预存跳过（含月视图共存冒烟）
- [x] 9.4 Smoke test — 视觉验收（格内物理行为由 vitest 覆盖；动画质感需浏览器目视确认）：
  - [x] 宠物进格：从格中心落地（enter 下沉）
  - [x] 贴边行走：沿四边吸附点移动，可见绕边路径
  - [x] 吸附落定：到边线骤停 + 短停留
  - [x] 高完成度格：快走 + 贴边跳跃（影子缩小）+ happy
  - [x] 低完成度格：贴底边慢行 + 懒散（idle_variant），不跳跃
  - [x] 离开格子恢复游走；组件卸载无残留 rAF
- [x] 9.5 `/opsx:verify` — 三维度核验（Completeness/Correctness/Coherence）通过
- [x] 9.6 归档：`/opsx:archive`（含 delta specs sync + `openspec validate --specs`）
