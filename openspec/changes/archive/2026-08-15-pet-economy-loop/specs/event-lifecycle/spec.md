# event-lifecycle Specification

## MODIFIED Requirements

### Requirement: 事件更新不重新检测冲突
`EventApplicationService.update()` SHALL 先通过 `getById` 做归属校验，然后调用 `existing.update(data)` 部分更新（仅覆盖非 null 字段），再调用 `existing.isValid()` 校验。SHALL NOT 重新执行冲突检测。更新过程中 SHALL 检测状态迁移：原状态非 COMPLETED 且更新后为 COMPLETED 时，SHALL 调用 `grantReward(EVENT_COMPLETED, String.valueOf(eventId))` 发放宠物奖励（幂等，详见 pet-economy-loop）。

#### Scenario: 更新时间不触发冲突检测
- **WHEN** 更新事件 A 的时间，使其与事件 B 重叠
- **THEN** 更新成功，不抛出冲突异常

#### Scenario: 部分更新保留未修改字段
- **WHEN** 更新事件仅修改 title，未修改 startTime/endTime
- **THEN** 其他字段保持不变

#### Scenario: PLANNED 更新为 COMPLETED 触发奖励
- **WHEN** 将 status=PLANNED 的事件更新为 status=COMPLETED
- **THEN** 事件更新成功，宠物获得 +20 专注币 / +30 经验（按 eventId 幂等）

#### Scenario: 再次更新已完成事件不重复发放
- **WHEN** 对已 COMPLETED 的事件再次更新（原状态已为 COMPLETED）
- **THEN** 不触发奖励发放（幂等键命中或未发生状态迁移）
