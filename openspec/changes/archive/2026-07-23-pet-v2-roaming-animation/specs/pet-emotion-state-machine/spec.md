# Pet Emotion State Machine

宠物情绪状态机 — 8 种情绪状态 + 平滑过渡 + 条件触发。

## ADDED Requirements

### Requirement: Emotion State Machine
系统 SHALL 维护宠物的情绪状态机，管理状态切换与动画映射。

#### Scenario: State definitions
- **WHEN** `petStore` 初始化
- **THEN** 支持以下情绪状态: `idle`, `idle_variant`, `happy`, `sad`, `hungry`, `sleepy`, `excited`, `surprised`
- **THEN** 默认状态为 `idle`

#### Scenario: Idle variant random trigger
- **WHEN** 宠物处于 `idle` 状态超过 15 秒
- **THEN** 每 15-30 秒随机触发 `idle_variant`（小动作: 眨眼/伸懒腰/舔爪子）
- **THEN** `idle_variant` 播放 2-3s 后自动回到 `idle`

### Requirement: Event-Driven State Transitions
系统 SHALL 根据事件总线事件触发情绪状态变化。

#### Scenario: Happy on completion
- **WHEN** 收到 `event:completed` 或 `task:completed` 事件
- **THEN** 宠物切换为 `happy` 状态，持续 5s 后回 `idle`

#### Scenario: Excited on combo
- **WHEN** 连续收到 3 个及以上 `completed` 事件（间隔 < 30s）
- **THEN** 宠物切换为 `excited`（快速蹦跳），播放粒子爆发，持续 5s

#### Scenario: Sad on cancellation
- **WHEN** 收到 `event:cancelled` 事件
- **THEN** 宠物切换为 `sad` 状态，持续 5s

#### Scenario: Hungry on low stat
- **WHEN** `hunger < 30` 且用户打开应用
- **THEN** 宠物 30% 概率展示 `hungry` 状态 + 气泡提示

#### Scenario: Sleepy at night
- **WHEN** 当前时间 > 23:00
- **THEN** 宠物 50% 概率展示 `sleepy` 状态（打哈欠）

### Requirement: Smooth Transition Between States
情绪状态切换 SHALL 使用平滑过渡，避免硬切。

#### Scenario: Animate state transition
- **WHEN** 状态从 A 切换到 B
- **THEN** 使用 framer-motion `AnimatePresence` 的 `exit` + `initial` 做过渡
- **THEN** 过渡时长 300-500ms

#### Scenario: Return to idle after timed state
- **WHEN** 定时状态（happy/sad/excited）持续时间结束
- **THEN** 平滑过渡回 `idle`，不跳变
