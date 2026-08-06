# Tasks: pet-vivid-engine

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  宠物表现层：Action/Emotion 双维状态机 + SVG 动画层 + 进窝睡眠可视化。
  纯前端变更（后端/契约/DB 均不触碰）。
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

## 7. 前端 (frontend/src/)
- [x] 7.1 `petStore`：新增 `action: PetAction`（`'idle' | 'walk' | 'pace' | 'rest' | 'sleep' | 'jump'`）+ `setAction(action, duration?)`（带 duration 到期回 idle，复用 stateTimer 语义）+ `reset()` 清理；更新 petStore 单测（初始 idle / 定时回退 / 与 emotion 正交并存 / reset 清理）
- [x] 7.2 `OrangeCat.tsx`：内嵌 `<style>` CSS 动画层（keyframes：breath 3s / blink 4s / leg-swing / tail-sway / sleep-curl / zzz-float / jump-rise）+ 动画元素 className（pet-body/pet-eyes/pet-tail/pet-legs/pet-sleep-bubble）+ SVG 根 `data-action` 属性；动作映射：idle→呼吸+眨眼、walk→步伐+起伏、rest→尾巴慢摆、sleep→蜷缩+Zzz、jump→离地；emotion 仍管脸部参数
- [x] 7.3 `ShibaInu.tsx`：同上动画层（柴犬差异：垂耳/卷尾参数微调，共用一个 style 注入）
- [x] 7.4 `SvgAvatar.tsx`：透传 `action` prop → SVG 根 `data-action` 属性
- [x] 7.5 `PetAvatar.tsx`：从 petStore 读 action 传给 SvgAvatar；下方叠加地面阴影 div（`pet-shadow` radial-gradient 椭圆，宽 60%，jump 时缩小变淡 CSS 动画）
- [x] 7.6 `RoamingPet.tsx` 接线：
  - 移动发起（tick 设 target / pacing 设 target）→ `setAction('walk')`
  - `motion.div` 加 `onAnimationComplete` → 移动结束：`isResting ? setAction('sleep') : setAction('idle')`（getState 读取，不重建依赖）
  - resting 分支 → `setAction('sleep')` + `setEmotion('sleepy')`（进窝即睡，Zzz 可见）
  - 双击玩耍 → `setAction('jump', 600)`
  - 写/更新 vitest：RoamingPet 接线测试（移动设 walk / 到达回 idle / 进窝 sleep + sleepy / 双击 jump）
- [x] 7.7 更新 vitest：SvgAvatar `data-action` 属性断言（idle/walk/sleep/jump 渲染）、PetAvatar 影子存在性、petStore action 单测
- [x] 7.8 更新 Playwright E2E（`e2e/pet-events.spec.ts` 或 pet.spec）：进窝睡眠冒烟（进入 /pet 页面不崩溃 + 宠物元素 data-action 存在）——睡眠动画为视觉行为，E2E 只做存在性断言

## 8. 文档同步（逐项评估——未触及的文档类别也必须写明"现有描述已核对仍准确"）
- [x] 8.1 `docs/frontend/component-catalog.md` — SvgAvatar（动画层）/RoamingPet（action 接线）/PetAvatar（影子）描述更新；petStore 描述补 action 维度
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；现有描述已核对仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及；现有描述已核对仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 未触及架构/模块结构；测试数核对（前端测试文件/用例数若变化以实测更新 marker）
- [x] 8.5 `README.md` — 未触及；现有描述已核对仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端 37 类 259 用例回归通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（47 文件 211 用例，连续 3 次全绿；首跑 1 例偶发 flaky 未能复现，记录待观察）
- [x] 9.3 `npm run test:e2e` — Playwright E2E 36 通过 + 1 预存跳过（含 data-action 冒烟）
- [x] 9.4 Smoke test — 视觉验收（E2E 已覆盖 data-action 存在性；动画效果需浏览器目视确认）：
  - [x] 宠物 idle：呼吸起伏可见 + 每 3-5s 眨眼一次
  - [x] 宠物游走：移动时步伐摆动 + 身体起伏
  - [x] 宠物进窝：蜷缩 + 闭眼 + Zzz 气泡循环（"终于见到宠物睡觉"）
  - [x] 双击宠物：跳起 + 影子缩小变淡
  - [x] 完成日程：走路时 happy 表情与步伐并存（正交）
