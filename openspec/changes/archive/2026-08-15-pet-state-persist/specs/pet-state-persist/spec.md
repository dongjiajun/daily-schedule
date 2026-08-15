# Pet State Persist（宠物状态持久化）

## ADDED Requirements

### Requirement: 游走状态持久化
`petStore` SHALL 接入 zustand `persist` 中间件，将陪伴感相关状态持久化到 localStorage（key `pet-roaming-state`，version `1`）：`{ position, facing, isResting, emotionState }`。其余 store 字段 SHALL NOT 落盘（见「瞬态状态不持久化」）。

#### Scenario: 状态写入 localStorage
- **WHEN** 宠物游走状态变化（position / facing / isResting / emotionState 任一更新）
- **THEN** localStorage `pet-roaming-state` 同步写入最新值

#### Scenario: 刷新后恢复
- **WHEN** 页面刷新且存在持久化记录
- **THEN** petStore 在初始化时从 localStorage rehydrate，position/facing/isResting/emotionState 恢复为上次会话值

#### Scenario: 无持久化记录时使用默认值
- **WHEN** 首次访问（无 `pet-roaming-state` 记录）
- **THEN** 使用既有默认值（position (100,100)、facing right、isResting false、emotionState idle），行为与持久化上线前一致

### Requirement: 情绪持久化白名单
`emotionState` 持久化 SHALL 仅覆盖稳定情绪：`idle` / `idle_variant` / `hungry` / `sleepy`。瞬态情绪（`happy` / `sad` / `excited` / `surprised`——由定时器自动回落）在持久化时 SHALL 归一为 `idle`，避免刷新后瞬态情绪永久残留。

#### Scenario: 稳定情绪落盘
- **WHEN** 宠物情绪为 `hungry` 且状态写入 localStorage
- **THEN** 持久化记录中 emotionState 为 `hungry`

#### Scenario: 瞬态情绪归一
- **WHEN** 宠物情绪为 `happy`（5s 后自动回 idle）且状态写入 localStorage
- **THEN** 持久化记录中 emotionState 为 `idle`（刷新后不会永远开心）

### Requirement: 恢复时视口越界钳制
rehydrate 时 SHALL 对 `position` 做视口越界钳制：x 钳制到 `[0, max(0, window.innerWidth - 宠物宽)]`、y 钳制到 `[0, max(0, window.innerHeight - 宠物高)]` 的安全范围，防止窗口缩放/换分辨率后宠物恢复在屏外不可见。`window` 不可用（测试/SSR）时 SHALL 跳过钳制。

#### Scenario: 越界位置钳制回视口
- **WHEN** 持久化 position 为 (3000, 500) 且视口宽度 1200
- **THEN** 恢复后 position.x 被钳制到视口安全范围（≤ 1200 - 宠物宽）

#### Scenario: 视口内位置原样恢复
- **WHEN** 持久化 position 在视口安全范围内
- **THEN** 恢复后 position 不变

### Requirement: 瞬态状态不持久化
以下瞬态字段 SHALL NOT 持久化：`action`（动作由游走/休息引擎驱动）、`particleTrigger`、`feedbackTrigger`、`bubbleMessage`、`selectionOpen`、`stateTimer`/`actionTimer`/`idleVariantTimer`（定时器句柄不可序列化）、`comboCount`、`lastInteractionTime`。刷新后这些字段 SHALL 回到默认值。

#### Scenario: 瞬态字段刷新后归默认
- **WHEN** 宠物处于 `eat` 动作且气泡/粒子展示中，页面刷新
- **THEN** action 恢复 `idle`、bubbleMessage 为 null、粒子触发器为 null，位置/休息态正常恢复
