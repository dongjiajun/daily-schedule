# Proposal: rhythm-e2e-stability

## Why
CI 门禁通过但 `e2e/rhythm-smoke.spec.ts` 偶发 flaky（2026-08-09 报告「早晨 8:00 睡眠中 → 唤醒」Retry#1 失败）：休息/夜间回窝的移动动画时长 `randomMoveDuration(0.5)` 为 6-16s，而 E2E 断言 `svg[data-action="sleep"]` 的窗口只有 10s——随机时长下探时耗尽窗口。`sleep` 动作唯一依赖动画完成回调（`onAnimationComplete`），时长随机性直接暴露为测试脆弱点；同时对用户而言 16s 走回小窝也超出合理等待感知。

## What Changes
- `RoamingPet.tsx` 休息移动时长档位 0.5 → 0.75（最坏 16s → 10.7s；正常档 1.0 为 3-8s，仍保留"休息慢速"语义）
- `e2e/rhythm-smoke.spec.ts` sleep 断言 timeout 10s → 20s（第 37/44 行两处，覆盖最坏时长 + 渲染调度开销）
- 核对 `RoamingPet.test.tsx` 中依赖 `randomMoveDuration` 具体档位的断言并同步

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `pet-roaming-system`: 夜间/休息回窝的移动时长上限量化约束（≤ 11s，慢于正常档但可感知），保证用户等待体验与自动化测试的确定性

## API Contract Impact
无（不涉及 `specs/openapi.yaml`）

## DDD Layer Impact
无（不触碰后端任何层）

## Database Impact
无需新 Flyway 迁移

## Impact
- `frontend/src/modules/pet/components/RoamingPet.tsx`（moveDuration 档位参数）
- `e2e/rhythm-smoke.spec.ts`（两处断言 timeout）
- `frontend/src/modules/pet/components/__tests__/RoamingPet.test.tsx`（若断言移动时长档位）
- `openspec/specs/pet-roaming-system/spec.md`（时长约束同步）
