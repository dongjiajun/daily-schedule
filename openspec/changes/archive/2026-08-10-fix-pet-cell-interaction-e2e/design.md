# Design: fix-pet-cell-interaction-e2e

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context
`e2e/pet.spec.ts:84` 本地持续失败（含 git stash 基线复现）、CI 通过。根因已定位（proposal 详见）：

- 点击格子 → `RoamingPet` `handlePointerDown` 注册 `user-interaction` 兴趣区（100% 吸引，decayTime 45s）→ 游走 tick 的 `determineMode` 先判时段：本地凌晨（hour 0-4 或 23）→ `period='night'` → `mode='resting'` → 541 分支「走向小窝睡觉」，兴趣区被完全忽略 → 宠物不进格子 → 格内物理（pace）永不启动 → 45s 超时
- CI runner 为 UTC 时区，运行时刻的 UTC hour 落白天时段 → `daytime` → 吸引生效 → 通过
- 产品代码**不是 bug**：spec「Rest behavior takes precedence」（`pet-roaming-system`）明确"进窝休息优先于格内互动"，夜间回窝优先是设计
- 测试缺陷：**时段敏感**——不注入时钟，结果随时区/运行时刻漂移

## Goals / Non-Goals

**Goals:**
- `pet.spec.ts:84` 与真实运行时刻/时区解耦，本地凌晨与 CI 结果一致
- 明确"节律时段敏感用例须固定 Date"的测试规范

**Non-Goals:**
- 不改产品代码（夜间休息优先是 spec 设计，`RoamingPet`/`determineMode` 零改动）
- 不引入完整假时钟（`clock.install` 会接管 timers，触发 rhythm-smoke 的动画冻结竞态）
- 不新增/删除 E2E 用例（用例数不变，`e2e-files=11` marker 不受影响）

## Decisions

### Decision 1: 用 `page.clock.setFixedTime()` 而非 `clock.install()`
- **选择**: `pet.spec.ts:84` 点击前调用 `page.clock.setFixedTime(new Date('2026-08-09T10:00:00'))`（白天 daytime 时段）。
- **理由**: `setFixedTime` 仅固定 `Date.now()`/`new Date()`，**不影响 timers 与 rAF**——游走 tick 仍按真实时间调度，Framer Motion 动画正常完成，规避 rhythm-e2e-stability 变更中发现的假时钟动画冻结竞态（该竞态要求 `clock.install` 接管 timers）。10:00 落 `daytime`（7-9 为 morning、12-14 为 afternoon，10 点避开了节律特殊时段），且不触发午后小憩/深夜打哈欠等随机节律行为。
- **备选方案**: (a) `clock.install` 全套假时钟——动画冻结风险（已踩坑），否决；(b) 测试改为"接受 night 回窝或格内互动任一结果"——弱化断言，掩盖回归；(c) 代码侧夜间点击也强制互动——违背「Rest behavior takes precedence」spec，否决。

### Decision 2: 清理/恢复时钟
- **选择**: 该测试内不显式调用 `clock.resume()`（`setFixedTime` 不接管 timers，无需恢复）；测试结束 Playwright 自动清理页面时钟。
- **理由**: `setFixedTime` 是轻量固定，无 timers 接管，无副作用残留。
- **备选方案**: 显式 `clock.resume()` 防御——不必要（无 install），增加噪音。

## DDD Layer Design

### 领域层 (domain/)
无变更（`determineMode`/`computeDayPeriod` 语义不变——夜间休息优先是既有设计）。

### 基础设施层 (infrastructure/)
无变更。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更。

### 前端 (frontend/src/ + e2e/)
```
e2e/pet.spec.ts  [修改] 「宠物进入日历格子 → 格内互动」用例：点击前 page.clock.setFixedTime(2026-08-09T10:00:00) + 注释说明时段敏感根因
```
- 无生产代码改动；无 vitest/playwright 配置改动

## API Design
无变更。

## Database Design
无变更。

## Risks / Trade-offs
- [setFixedTime 后其他节律用例行为受影响？] → 仅影响本用例所在 test（页面级时钟），Pet describe 内其他用例独立起页，无串扰；本用例内 10:00 无特殊节律分支（无小憩/哈欠/回窝）
- [CI 与本地结果一致性] → 固定 10:00 后两端判定均为 `daytime`，消除时区差异
- [修复后仍偶发失败？] → 若出现，下一步调查方向：dialog 打开期间兴趣区 decay/事件竞争（非时段问题），本次不预判

## Migration Plan
1. `pet.spec.ts:84` 加 `setFixedTime` + 注释
2. 本地（凌晨时段）跑 `pet.spec.ts` 验证通过（修复前后对比：修复前失败）
3. 完整 E2E 一轮确认无回归
4. `docs/architecture.md` 测试描述核对（用例数不变）
5. `/opsx:sync` 同步 `playwright-e2e-infrastructure` 主 spec → `/opsx:archive`
6. 回滚：单行测试代码移除，无数据迁移

## Open Questions
- 无。备注：pet.spec 其他用例（feed/eat/金币禁用）不涉及时段逻辑，无需固定时钟（已核对）。
