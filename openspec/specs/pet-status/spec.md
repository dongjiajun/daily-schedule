# Pet Status（宠物状态衰减）

## Purpose
通过 `@Scheduled` 定时任务每 10 分钟对所有宠物执行状态衰减。心情和饱腹度随时间自然下降，基于 `lastInteractedAt` 计算衰减量。衰减间隔可通过 `pet.decay.intervalMs` 配置。

## Requirements

### Requirement: 定时状态衰减
系统 SHALL 每 10 分钟自动对所有宠物执行一次衰减计算。心情和饱腹度随时间自然下降，下降量基于距上次互动的时间间隔。

衰减公式：`mood -= elapsedHours * 2`, `hunger -= elapsedHours * 3`（下限 0，不溢出为负）。

#### Scenario: 正常衰减
- **WHEN** 宠物上次互动时间为 1 小时前，衰减任务执行
- **THEN** mood 减少 2（100 → 98），hunger 减少 3（100 → 97），`updatedAt` 更新为当前时间

#### Scenario: 下限保护
- **WHEN** 宠物 mood = 1，hunger = 2，距上次互动 3 小时
- **THEN** 衰减后 mood = 0（不溢出），hunger = 0（不溢出）

#### Scenario: 刚互动过的宠物
- **WHEN** 宠物 `lastInteractedAt` 距现在 < 1 分钟
- **THEN** 衰减量 = 0（`elapsedHours ≈ 0`），状态不变

#### Scenario: 只衰减心情和饱腹
- **WHEN** 衰减任务执行
- **THEN** experience、level、coins 不变，只有 mood 和 hunger 受影响

### Requirement: 衰减不影响已删除/无主宠物
衰减任务 MUST 只处理有效宠物，不处理已逻辑删除的用户或数据。

#### Scenario: 无宠物用户不抛异常
- **WHEN** 系统中存在无宠物的用户
- **THEN** 衰减任务正常完成，不抛 NullPointerException

### Requirement: 查询时返回衰减后状态
`GET /pets/me` 返回的状态 SHALL 为最后一次衰减后的值。由于衰减每 10 分钟执行一次，查询时看到的为最近一次衰减后的快照。

#### Scenario: 查询显示衰减后状态
- **WHEN** 用户查询宠物，距上次互动 2 小时，最近一次衰减在 5 分钟前
- **THEN** 返回的 mood/hunger 已反映衰减后的值

### Requirement: 衰减任务执行频率可配置
衰减间隔 SHALL 可通过 Spring 配置覆盖（`@Scheduled(fixedRateString = "${pet.decay.intervalMs:600000}")`），方便测试和调优。

#### Scenario: 测试环境加速衰减
- **WHEN** `pet.decay.intervalMs = 1000`（1 秒）
- **THEN** 衰减每秒执行一次，测试可快速验证衰减效果
