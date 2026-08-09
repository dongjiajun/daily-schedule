# Pet Roaming System

## MODIFIED Requirements

### Requirement: Resting Behavior
宠物 SHALL 依据昼夜节律与空闲状态进入休息；夜间（23 点后）自动走向小窝进窝睡觉，早晨（7-9 点）醒来并问候；休息 SHALL 呈现可见的睡眠表现（蜷缩 + Zzz 循环气泡），替代静止不动。

#### Scenario: Move to resting spot
- **WHEN** 无用户交互 > 2 分钟且无事件触发
- **THEN** 宠物走向宠物小窝（`pet-spot` Zone 区域，右侧边栏底部附近）休息
- **THEN** 到达后触发 `sleepy` 表情 + `sleep` 动作（蜷缩 + Zzz 气泡循环）

#### Scenario: 夜间自动回窝
- **WHEN** 本地时间 ≥ 23 点且宠物未在休息
- **THEN** 宠物 SHALL 立即走向小窝进窝睡觉（不原地硬切休息），到达后 `sleep` 动作 + 蜷缩 + Zzz

#### Scenario: 早晨醒来问候
- **WHEN** 本地时间处于 7-9 点且宠物正在睡眠中（每日首次）
- **THEN** 宠物 SHALL 唤醒（回 idle）+ 气泡"早上好~ ☀️"，当日不重复

#### Scenario: Resume roaming on activity
- **WHEN** 宠物在休息中且用户产生交互
- **THEN** 宠物唤醒，恢复 `idle` 状态，重新开始漫步

#### Scenario: Enter home spot to rest
- **WHEN** 宠物游走进入小窝（`pet-spot` Zone）区域
- **THEN** 宠物 SHALL 自动进窝休息（触发 `sleepy` 表情 + `sleep` 动作），无需等待无交互 2 分钟计时
- **THEN** 宠物 SHALL 停留在小窝内不再随机漫步，直到用户交互唤醒

## ADDED Requirements

### Requirement: 作息节律
宠物行为 SHALL 随本地时间呈现昼夜节律：午后低概率小憩（rest 动作，区别于夜间 sleep），深夜未睡时打哈欠提示休息（反哺机制）。

#### Scenario: 午后小憩
- **WHEN** 本地时间处于 12-14 点且宠物未休息，游走 tick 判定（低概率 ~5%）
- **THEN** 宠物 SHALL 短暂小憩（`rest` 动作，约 90s），期间不随机漫步，到期恢复游走

#### Scenario: 深夜打哈欠提示
- **WHEN** 本地时间 ≥ 23 点且宠物未休息（夜间 tick 判定，低概率 ~10%，冷却 10 分钟）
- **THEN** 宠物 SHALL 打哈欠（`yawn` 动作 1.8s）+ 气泡"夜深啦，该睡觉了~ 😴"，不强制回窝

#### Scenario: 时段判定纯函数化
- **WHEN** 游走 tick 需要作息决策
- **THEN** 时段判定（night/morning/afternoon/daytime）SHALL 由纯函数按注入的本地小时数计算，不依赖组件内 Date 硬编码，便于单测与小程序复用
