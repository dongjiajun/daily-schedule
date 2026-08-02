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

#### Scenario: Even distribution across viewport
- **WHEN** 宠物处于 `wandering` 模式且视口存在大范围 soft 避让区（如日历网格）
- **THEN** 目标生成 SHALL 采用 soft 权重化：目标点以一定比例全域采样（保证覆盖视口全域），soft 区目标以降低的概率接受（50% 接受率）而非"拒绝-重试"的排斥物理
- **THEN** 宠物活动范围 SHALL 不因 soft 区而持续压缩到角落——soft 区只是降频区，不是排斥墙
- **THEN** hard 避让区目标 SHALL 继续完全拒绝

#### Scenario: Roam cadence survives re-render
- **WHEN** 宠物游走中且发生与游走无关的渲染（宠物数据轮询刷新 / 情绪变化 / hover 浮窗）
- **THEN** 游走 tick 间隔 SHALL 不被重置或拉长——渲染 SHALL NOT 清除或重排游走 timer
- **THEN** 游走节奏保持 10-30s 随机间隔，仅由游走循环自身驱动

### Requirement: Interest Point Attraction
宠物 SHALL 对用户行为产生兴趣，基于 Zone 区域感知机制主动靠近活跃区域。

#### Scenario: Approach cursor area
- **WHEN** 鼠标/手指在页面上停留 > 3 秒
- **THEN** 宠物 50% 概率创建 `user-interaction` 类型 Zone 并向其靠近
- **THEN** 靠近距离不超过光标 100px 范围
- **THEN** 兴趣区域吸引力随时间衰减（decayTime 后移除）
- **THEN** 保鲜期（decayTime）SHALL 覆盖最大游走间隔（45s > 30s tick + 移动余量）——宠物在任意 tick 都能感知到未过期的兴趣区
- **THEN** 衰减判定 SHALL 在宠物感知（游走 tick 读取 Zone 列表）时惰性执行，到期后宠物下一 tick 感知不到该 Zone 并恢复 `wandering`

#### Scenario: Approach active content
- **WHEN** 用户点击/输入页面元素
- **THEN** 宠物 30% 概率创建 `user-interaction` 类型 Zone 并向其靠近
- **THEN** 在该区域停留 5-10s 后恢复随机漫步

#### Scenario: Attraction follows zone model
- **WHEN** 宠物处于 `attracted` 模式
- **THEN** 目标位置基于当前活跃 Zone 的几何中心或边缘计算（而非点对点）
- **THEN** Zone 位于 hard 避让区内时 SHALL 放弃吸引并退回 `wandering`

### Requirement: Bubble Text Readability
宠物气泡文字 SHALL 在任何朝向（`facing: 'left' | 'right'`）下保持正读（非镜像）。

#### Scenario: Bubble readable when facing left
- **WHEN** 宠物 `facing === 'left'` 且气泡展示中
- **THEN** 气泡文字 SHALL 以正常方向呈现（不可读的镜面文字不得出现）

#### Scenario: Bubble readable when facing right
- **WHEN** 宠物 `facing === 'right'` 且气泡展示中
- **THEN** 气泡文字 SHALL 以正常方向呈现

### Requirement: Resting Behavior
宠物 SHALL 在空闲一段时间后进入休息状态。

#### Scenario: Move to resting spot
- **WHEN** 无用户交互 > 2 分钟且无事件触发
- **THEN** 宠物走向宠物小窝（`pet-spot` Zone 区域，右侧边栏底部附近）休息
- **THEN** 到达后触发 `sleepy` 状态，可能趴下或蜷缩

#### Scenario: Resume roaming on activity
- **WHEN** 宠物在休息中且用户产生交互
- **THEN** 宠物唤醒，恢复 `idle` 状态，重新开始漫步

#### Scenario: Enter home spot to rest
- **WHEN** 宠物游走进入小窝（`pet-spot` Zone）区域
- **THEN** 宠物 SHALL 自动进窝休息（触发 `sleepy`/resting 状态），无需等待无交互 2 分钟计时
- **THEN** 宠物 SHALL 停留在小窝内不再随机漫步，直到用户交互唤醒

### Requirement: Calendar Cell Interaction
宠物 SHALL 在进入日历格子（`calendar-cell` Zone）时产生格内互动，互动风格由当天日程完成度决定。

#### Scenario: Pacing within the cell
- **WHEN** 宠物游走进入某个 `calendar-cell` Zone（月视图日期格子）
- **THEN** 宠物 SHALL 在该格子内左右往返走动（沿格子水平方向小幅移动，不离开格子范围）
- **THEN** 宠物保持格内往返直到离开格子区域，之后恢复随机漫步

#### Scenario: Completion determines pace and mood
- **WHEN** 宠物在 `calendar-cell` Zone 内且该日完成度高（≥ 50%）
- **THEN** 宠物 SHALL 以较快速度往返并呈现开心情绪（happy），体现"日程完成得好，宠物也开心"
- **WHEN** 宠物在 `calendar-cell` Zone 内且该日完成度低（< 50%）
- **THEN** 宠物 SHALL 以较慢速度往返并呈现懒散情绪（如 sad/idle_variant），体现"日程完成少，宠物也提不起劲"

#### Scenario: Rest behavior takes precedence
- **WHEN** 宠物同时处于 `pet-spot` Zone（小窝）与 `calendar-cell` Zone 重叠区域
- **THEN** 进窝休息行为 SHALL 优先于格内互动（宠物先休息，不往返）
