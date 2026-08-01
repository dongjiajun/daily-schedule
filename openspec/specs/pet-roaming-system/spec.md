# Pet Roaming System

宠物游走引擎 — 宠物以独立角色形式在页面自由移动，替代固定卡片。

## Purpose

宠物游走引擎 — 宠物以独立角色形式在页面自由移动，替代固定卡片。

## Requirements

### Requirement: Free-Roaming Character
宠物 SHALL 以独立角色精灵（非卡片包裹）形式存在于应用页面中，`pointer-events: none`。

#### Scenario: Pet renders as standalone sprite
- **WHEN** 用户已拥有宠物且位于主应用页面
- **THEN** 宠物渲染为 50-80px 的角色精灵，无卡片/边框/背景包裹
- **THEN** `pointer-events: none` 确保日历网格和其他 UI 元素可正常交互

#### Scenario: No overlap with calendar cells
- **WHEN** 宠物游走到日历月视图区域
- **THEN** 宠物自动停留在日历网格外部，不遮挡单元格内容
- **THEN** 检测 `.rbc-month-view` 边界并调整路径

### Requirement: Random Walk Algorithm
宠物 SHALL 在页面上自主移动，模拟自然漫步行为。

#### Scenario: Periodic random movement
- **WHEN** 宠物处于 `idle` 状态
- **THEN** 每 10-30 秒随机选择页面内的新坐标
- **THEN** 以 framer-motion `animate` 驱动 x/y 平滑过渡（duration 3-8s）
- **THEN** 移动速度受情绪影响（happy 快、sad 慢）

#### Scenario: Direction awareness
- **WHEN** 宠物水平移动
- **THEN** 向右移动时 `scaleX: 1`，向左移动时 `scaleX: -1`（镜像翻转）

#### Scenario: Boundary avoidance
- **WHEN** 随机目标超出视口边界
- **THEN** 自动 clamp 到安全区域内（留出 20px padding）

### Requirement: Interest Point Attraction
宠物 SHALL 对用户行为产生兴趣，主动靠近活跃区域。

#### Scenario: Approach cursor area
- **WHEN** 鼠标/手指在页面上停留 > 3 秒
- **THEN** 宠物 50% 概率向光标区域靠近
- **THEN** 靠近距离不超过光标 100px 范围

#### Scenario: Approach active content
- **WHEN** 用户点击/输入页面元素
- **THEN** 宠物 30% 概率靠近该区域
- **THEN** 在该区域停留 5-10s 后恢复随机漫步

### Requirement: Resting Behavior
宠物 SHALL 在空闲一段时间后进入休息状态。

#### Scenario: Move to resting spot
- **WHEN** 无用户交互 > 2 分钟且无事件触发
- **THEN** 宠物走向最近的预设休息点（右下角/左下角/侧边栏附近）
- **THEN** 到达后触发 `sleepy` 状态，可能趴下或蜷缩

#### Scenario: Resume roaming on activity
- **WHEN** 宠物在休息中且用户产生交互
- **THEN** 宠物唤醒，恢复 `idle` 状态，重新开始漫步
