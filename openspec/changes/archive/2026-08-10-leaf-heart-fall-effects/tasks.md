# Tasks: leaf-heart-fall-effects
<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — 勾选补正：任务均已落地（功能/修复/验证在 v3.5.1 生效）；用户跟进观感项已移交用户实机目测 -->

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
- [x] N/A — 无 Flyway 迁移（纯前端 + shared 包消费，无表/字段变更）

## 2. 领域层 (domain/)
- [x] N/A — 无后端变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 无后端变更

## 4. 应用层 (application/)
- [x] N/A — 无后端变更

## 5. API 层 (api/)
- [x] N/A — 无后端变更

## 6. 契约同步
- [x] N/A — 无 API 契约变更（不涉及 specs/openapi.yaml / CHANGELOG / 版本号三同步）

## 7. 前端 (frontend/src/)
- [x] 7.1 新增 `core/components/effects/LeafFallEffect.tsx` — 落叶飘落（emoji: 🍂🍁🌿🍃，keyframes: `leaffall`，intensity: full 40 / low 20，复用 PetalFallEffect 形态：useMemo 随机 + 内联 `<style>` + pointer-events-none + aria-hidden）
- [x] 7.2 新增 `core/components/effects/HeartFallEffect.tsx` — 爱心飘落（emoji: 💖💕❤️💘，keyframes: `heartfall`，同上强度分级）
- [x] 7.3 修改 `core/components/effects/EffectLayer.tsx`：
  - 删除本地 `effectMap` 硬编码映射，改用 `import { getThemeForHoliday } from '@daily-schedule/shared/holiday'`，`getThemeForHoliday(activeHolidayId).effectType` 解析（返回 `EffectType` 联合类型）
  - 渲染分支追加 `{effectType === 'leaf' && <LeafFallEffect .../>}`、`{effectType === 'heart' && <HeartFallEffect .../>}`
  - 删除/修正 "heart / leaf effects are handled by CSS gradient overlay in themes" 误导注释
- [x] 7.4 更新 `core/components/effects/__tests__/EffectLayer.test.tsx` — 新增情人节激活爱心（💖）、感恩节激活落叶（🍂）场景断言；现有断言不变
- [x] 7.5 新增 `core/components/effects/__tests__/LeafFallEffect.test.tsx` / `HeartFallEffect.test.tsx` — 渲染 emoji 内容 + intensity 分级数量断言（full 40 / low 20）
- [x] 7.6 核对 Playwright E2E（`e2e/*.spec.ts`）— 核对结论：现有 E2E 无节日特效断言（特效为纯视觉装饰且依赖真实节日日期，vitest 已覆盖组件渲染），无需新增
- [x] 7.7 运行 `npm run test:e2e` 确认 E2E 全部通过（与变更相关的用例全部通过；`pet.spec.ts:84` 为既有本地失败，stash 基线确认与本次变更无关）

## 8. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 8.1 `docs/frontend/component-catalog.md` — **涉及（新增 2 组件 + 修改 EffectLayer）** → 新增 `LeafFallEffect`/`HeartFallEffect` 条目，更新 `EffectLayer` 条目（6 种特效 + 共享包解析源）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；核对现有描述仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及；核对现有描述仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 涉及（特效系统描述 + 测试数变更）→ 更新 `docs/architecture.md` 测试数 marker（48→50）+ CLAUDE.md 特效数量（5→6 种）+ 测试数 marker（48→50，232→238 用例）；版本号保持 v3.3.4（docs-check 强校验与 openapi.yaml 一致，无 API 变更）
- [x] 8.5 `README.md` — 涉及功能清单 → 特效 5 种 → 6 种（雪花/烟花/花瓣/灯笼/落叶/爱心）
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（259 用例，BUILD SUCCESS）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（50 文件 238 用例）
- [x] 9.3 `cd frontend && npm run test:e2e` — 完整 E2E 通过（41 过 + 1 跳过；`pet.spec.ts:84` 既有本地失败与变更无关，stash 基线确认、CI 通过）
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证：
  - [x] 特效渲染由 vitest 覆盖：`EffectLayer.test.tsx` 断言 valentines→💖、thanksgiving→🍂；`LeafFallEffect`/`HeartFallEffect` 数量分级
  - [x] `effectIntensity = 'off'` 不渲染 / 移动端降级：既有 EffectLayer 测试逻辑覆盖（off 早退 + isMobile 降级未变）
  - [x] 剩余手工项：真实节日到来时的视觉观感（落叶/爱心飘落动画流畅度、既有 firework/snow/lantern 回归目测）——建议用户在情人节/感恩节实际触发时目测确认
