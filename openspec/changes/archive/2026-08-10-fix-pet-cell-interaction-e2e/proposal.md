# Proposal: fix-pet-cell-interaction-e2e

## Why
`e2e/pet.spec.ts:84`「宠物进入日历格子 → 格内互动」本地持续失败（CI 通过）。根因：测试**未注入时钟**，依赖真实本地时段——本地凌晨（hour < 5 或 ≥ 23）运行时 `determineMode` 返回 `period='night'` → `mode='resting'` → 宠物按节律走向小窝睡觉，点击格子注册的 `user-interaction` 兴趣区被完全忽略 → 格内物理永不启动 → `pace` 45s 超时。CI runner 为 UTC 时区，测试运行时刻落白天时段所以通过——**时段敏感测试缺陷**，与产品代码无关（spec「Rest behavior takes precedence」确认夜间休息优先于格内互动是设计）。

## What Changes
- `e2e/pet.spec.ts:84` 在点击格子前注入固定日期（`page.clock.setFixedTime` 到白天时段如 10:00）——`setFixedTime` 只固定 `Date`，不影响 timers，无 rhythm-smoke 的假时钟动画冻结问题
- 核对 pet.spec 其余用例是否存在同类时段敏感性（如依赖真实时间的节律相关断言）

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `playwright-e2e-infrastructure`: 涉及节律/时段敏感行为的 E2E 用例 SHALL 固定 `Date` 到明确时段，避免依赖真实运行时刻

## API Contract Impact
无（不涉及 `specs/openapi.yaml`）

## DDD Layer Impact
无（不触碰后端任何层；前端产品代码零改动——夜间休息优先是 spec 既有设计）

## Database Impact
无需新 Flyway 迁移

## Impact
- `e2e/pet.spec.ts`（点击前固定时钟）
- 文档：`docs/architecture.md` 测试描述核对（E2E 用例数不变）
- `openspec/specs/playwright-e2e-infrastructure/spec.md`（时段固定约束同步）
