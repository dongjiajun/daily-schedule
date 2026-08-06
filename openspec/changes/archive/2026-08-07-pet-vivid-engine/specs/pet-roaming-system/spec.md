# Pet Roaming System

宠物游走系统 — 自由漫步 + 区域感知 + 休息/睡眠表现。

## Purpose

宠物游走系统 — 自由漫步 + 区域感知 + 休息/睡眠表现。

## Requirements

## MODIFIED Requirements

### Requirement: Resting Behavior
宠物 SHALL 在空闲一段时间后进入休息状态；休息 SHALL 呈现可见的睡眠表现（蜷缩 + Zzz 循环气泡），替代静止不动。

#### Scenario: Move to resting spot
- **WHEN** 无用户交互 > 2 分钟且无事件触发
- **THEN** 宠物走向宠物小窝（`pet-spot` Zone 区域，右侧边栏底部附近）休息
- **THEN** 到达后触发 `sleepy` 表情 + `sleep` 动作（蜷缩 + Zzz 气泡循环）

#### Scenario: Resume roaming on activity
- **WHEN** 宠物在休息中且用户产生交互
- **THEN** 宠物唤醒，恢复 `idle` 状态，重新开始漫步

#### Scenario: Enter home spot to rest
- **WHEN** 宠物游走进入小窝（`pet-spot` Zone）区域
- **THEN** 宠物 SHALL 自动进窝休息（触发 `sleepy` 表情 + `sleep` 动作），无需等待无交互 2 分钟计时
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

### Requirement: 移动与动作联动
宠物移动中 SHALL 呈现 `walk` 动作（步伐动画），移动完成回到 `idle`（或 `sleep` 若在休息中）。

#### Scenario: Walking while moving
- **WHEN** 宠物开始移动（游走/往返设置新目标）
- **THEN** action 切换为 `walk`，步伐动画播放

#### Scenario: Idle on arrival
- **WHEN** 移动完成（到达目标位置）
- **THEN** action 回 `idle`；若处于休息中则回 `sleep`
