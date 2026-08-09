# Design: rhythm-e2e-stability

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context
2026-08-09 CI 门禁通过但 `e2e/rhythm-smoke.spec.ts`「早晨 8:00 睡眠中 → 唤醒」Retry#1 失败（flaky）。根因已定位：

- 夜间/休息回窝的移动动画时长 `randomMoveDuration(0.5)` = 6-16s（`MOVE_DURATION_MIN/MAX` = 3-8s，÷0.5 放大 2 倍）
- `sleep` 动作**唯一**由 Framer Motion `onAnimationComplete` 回调设置（`RoamingPet.tsx:738-739`，`s.setAction(s.isResting ? 'sleep' : 'idle')`），依赖真实时间动画完成
- E2E 断言 `svg[data-action="sleep"]` 窗口仅 10s → 随机时长下探时耗尽窗口 → 偶发失败；重试随机到短时长 → 通过
- 单元测试（`RoamingPet.test.tsx`）断言 store 状态（`isResting`/`position`），不依赖动画时长 → 档位改动零回归
- spec「Resting Behavior」要求"不原地硬切休息"（`spec.md:94`）→ 走路动画是产品语义，不可移除

## Goals / Non-Goals

**Goals:**
- 消除 `rhythm-smoke.spec.ts` 的 flaky（动画时长与断言窗口的解耦余量）
- 回窝移动时长收敛到用户可感知范围（≤ 11s，仍慢于正常档 3-8s）
- 保持"走向小窝"的走路动画语义（spec 约束）

**Non-Goals:**
- 不改变 `sleep` 的触发机制（保持 `onAnimationComplete` + 进窝边沿检测，不引入"直接 sleep"——违背 spec「不原地硬切」）
- 不修改 shared 包 `randomMoveDuration` 的数学语义（3-8s 基数不变，只调调用处档位参数）
- 不重构 `rhythm-smoke.spec.ts` 的用例结构（仅调 timeout）

## Decisions

### Decision 1: 休息移动时长档位 0.5 → 0.75
- **选择**: `RoamingPet.tsx:680` 休息档 `randomMoveDuration(0.5)` → `randomMoveDuration(0.75)`。最坏时长 16s → 10.7s（8000 ÷ 0.75 ≈ 10667ms），常态 4-10.7s。
- **理由**: 0.75 保持"休息慢速"语义（相对正常档 1.0），同时把最坏时长压入 E2E 断言余量内；单点参数改动，`useMemo` 结构不变，渲染/状态逻辑零触碰。单元测试不依赖动画时长（已核对）→ 无回归。
- **备选方案**: (a) 1.0 档（3-8s）——最快但失去休息慢速的节奏差异，宠物深夜回窝与白天漫游速度无区别；(b) 只改测试 timeout 不动代码——治标不治本，用户等待 16s 的产品体验问题仍在；(c) `startResting` 时直接 `setAction('sleep')` 不走路——违背 spec「不原地硬切休息」。

### Decision 2: E2E sleep 断言 timeout 10s → 20s
- **选择**: `rhythm-smoke.spec.ts` 第 37/44 行 `toBeVisible({ timeout: 10_000 })` → `{ timeout: 20_000 }`。
- **理由**: 覆盖 10.7s 最坏动画时长 + 渲染提交/调度开销 + CI runner 负载余量（≈2× 上限）。20s 仍能捕获真实回归（若 sleep 不再出现会持续失败），窗口过宽掩盖问题的风险可控。
- **备选方案**: (a) 30s——过宽，掩盖节律逻辑回归；(b) 精确等待（`expect.poll` 按 store action 轮询）——改动测试结构，收益不足以抵消复杂度。

### Decision 4（实现中发现，追加）: E2E 假时钟竞态根治 — `page.clock.resume()`
- **选择**: `rhythm-smoke.spec.ts` 中 `fastForward` 推进游走 tick 后调用 `page.clock.resume()` 恢复真实时钟；sleep 断言 timeout 20s；describe 级 `test.describe.configure({ timeout: 120_000 })`。
- **理由**: 实施验证中发现更深的竞态——`page.clock` 假时钟下，若 React 渲染提交（Zustand set → 渲染 → motion.div animate 更新）落在 `fastForward` 窗口外，Framer Motion 的 rAF 动画帧随假时钟停止推进 → **动画冻结，`onAnimationComplete` 永不触发，sleep 永不出现**（与 timeout 大小无关，单跑/并行均可能触发；CI 通过仅为渲染时机差异）。`resume()` 后 rAF/动画回真实时间驱动，等待时间与动画时长解耦。早晨唤醒段的 `setFixedTime` 在 resume 后仍有效（不影响 timers），唤醒由下一真实 tick（10-30s）触发，气泡断言 timeout 40s。
- **备选方案**: (a) 只加大 timeout——无效（冻结时动画永不完成）；(b) `runFor` 分段推进假时钟——无法覆盖渲染提交窗口外的情况；(c) 测试改为直接断言 store 状态——偏离 E2E DOM 断言惯例。

### Decision 3: 不改变 sleep 触发机制
- **选择**: 维持现状——`sleep` 由「进窝边沿检测（`inHome && !wasInHome && !resting`）」或「`onAnimationComplete`（resting 时）」两条路径设置。
- **理由**: 边沿检测的 `!resting` 守卫是"唤醒后 position 仍在窝内时不立即再睡"的必要条件（`RoamingPet.tsx:449-461` 注释）；`onAnimationComplete` 路径语义正确（到达才蜷缩）。本次加固只需解决时长上限与断言窗口的匹配，无需触碰状态机。
- **备选方案**: 在 tick 中"目标 = 窝中心 且 已 resting"时提前 `setAction('sleep')`——会在走路动画进行中蜷缩，视觉错误。

## DDD Layer Design

### 领域层 (domain/)
无变更（`packages/shared/src/pet/roaming.ts` 的 `randomMoveDuration` 数学语义不变，仅前端调用参数变化）。

### 基础设施层 (infrastructure/)
无变更。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更。

### 前端 (frontend/src/)
```
modules/pet/components/RoamingPet.tsx        [修改] L680: randomMoveDuration(0.5) → randomMoveDuration(0.75)
e2e/rhythm-smoke.spec.ts                     [修改] L37/L44: toBeVisible timeout 10_000 → 20_000
modules/pet/components/__tests__/RoamingPet.test.tsx  [核对] 不依赖动画时长，无需改动
```

- 无 Zustand store / React Query / 路由变更
- `moveDuration` 的 `useMemo` 依赖（`isResting`/`pacingCellId`）不变

## API Design
无变更（不涉及 `specs/openapi.yaml`）。

## Database Design
无变更（无 Flyway 迁移）。

## Risks / Trade-offs
- [0.75 档最坏 10.7s 与 20s 窗口仍有 ~2× 余量] → 已核算；若 CI 环境出现系统性慢于 20s 的迹象，回退选项是把 timeout 提到 30s 或把档位降到 1.0
- [回窝速度感知变化（16s → 10.7s 上限）] → 仍慢于正常档，节奏差异保留；属于用户可接受的优化方向
- [E2E 首次运行时动画已在进行中（installClockAt 等待窗口）] → 与改动无关（fastForward 后重新调度），既有行为
- [单元测试零回归] → 已核对 RoamingPet.test.tsx 全部断言为 store 状态，无动画时长依赖

## Migration Plan
1. `RoamingPet.tsx` 档位参数 0.5 → 0.75（含注释更新）
2. `rhythm-smoke.spec.ts` 两处 timeout 10s → 20s
3. 运行 `pnpm run verify`（lint + tsc + build + vitest，覆盖 RoamingPet.test）
4. 运行 `npm run test:e2e` 至少 2 轮，确认 rhythm-smoke 稳定通过
5. 更新 `docs/architecture.md`（节律/游走描述核对）+ `openspec/specs/pet-roaming-system/spec.md`（`/opsx:sync` 同步）
6. 回滚：单文件参数回退，无数据迁移

## Open Questions
- 无阻塞问题。备注：若未来 E2E 需要更强的确定性，可引入"按 store 状态轮询"的 helper（`expect.poll`），本次不引入以保持测试结构最小化。
