# Pet Roaming System

宠物游走系统 — 自由漫步 + 区域感知 + 休息/睡眠表现。

## Purpose

宠物游走系统 — 自由漫步 + 区域感知 + 休息/睡眠表现。

## Requirements

## ADDED Requirements

### Requirement: 格内物理行为
宠物在日历格子内 SHALL 呈现物理质感的互动（贴边行走 / 重力下沉 / 吸附落定 / 偶尔跳跃），替代直线往返：进入格子后沿四边吸附点行走，垂直方向重力下沉贴底边，到达吸附点时位置吸附落定并短暂停留，快风格下偶尔贴边跳跃（sin 抛物线）后落回。

#### Scenario: 贴边行走
- **WHEN** 宠物进入 `calendar-cell` Zone 且状态为 walk
- **THEN** 沿格子四边吸附点依次行走（绕边不回头），不离开格子范围

#### Scenario: 重力下沉贴底边
- **WHEN** 宠物在格内处于 cling/落地状态
- **THEN** 垂直方向缓慢下沉至格子底边（重力感），水平位置保持在吸附点

#### Scenario: 吸附落定
- **WHEN** 宠物到达某条边的吸附点
- **THEN** 位置吸附到边线并停留 0.6-2s（快风格短、慢风格长），之后继续走向下一个吸附点

#### Scenario: 贴边跳跃
- **WHEN** 格内完成度 ≥ 50% 且处于 cling 状态
- **THEN** 40% 概率触发跳跃（y 按 sin 抛物线偏移 8-12px，0.6s 落回），期间 action 为 `jump`（复用跳跃动画与影子变化）

#### Scenario: 低完成度贴底边
- **WHEN** 格内完成度 < 50%
- **THEN** 仅沿底边与侧边下半的吸附点行走（bottomOnly），跳跃不触发

### Requirement: 格内状态机生命周期
格内物理互动 SHALL 由帧循环（rAF）驱动状态机（enter → cling → walk → cling → hop → … → exit），仅在格内激活；离开格子 / 状态机超时（快 10s / 慢 15s）/ 组件卸载 SHALL 强制退出并恢复游走。

#### Scenario: 进入格子启动帧循环
- **WHEN** 宠物进入 `calendar-cell` Zone
- **THEN** 启动 rAF 帧循环与格内状态机，action 切换为 `pace`，游走 tick 暂停

#### Scenario: 离开格子恢复游走
- **WHEN** 宠物位置移出格子范围或状态机完成
- **THEN** 取消帧循环，恢复随机漫步 tick

#### Scenario: 状态机超时强制退出
- **WHEN** 格内互动超过时长上限（快 10s / 慢 15s）
- **THEN** 无论当前位置强制退出格内状态，恢复游走

#### Scenario: 组件卸载清理
- **WHEN** RoamingPet 卸载
- **THEN** 取消帧循环，无残留定时器

## MODIFIED Requirements

### Requirement: Calendar Cell Interaction
宠物 SHALL 在进入日历格子（`calendar-cell` Zone）时产生格内互动，互动风格由当天日程完成度决定；互动 SHALL 呈现物理质感（贴边/重力/吸附/跳跃，见"格内物理行为"），而非直线往返。

#### Scenario: Pacing within the cell
- **WHEN** 宠物游走进入某个 `calendar-cell` Zone（月视图日期格子）
- **THEN** 宠物 SHALL 在格子内执行格内物理互动（贴边行走 + 吸附停留 + 可选的跳跃），不离开格子范围
- **THEN** 格内互动结束后（状态机完成或离开）恢复随机漫步

#### Scenario: Completion determines pace and mood
- **WHEN** 宠物在 `calendar-cell` Zone 内且该日完成度高（≥ 50%）
- **THEN** 宠物 SHALL 以较快速度贴边行走（60px/s）并呈现开心情绪（happy），40% 概率贴边跳跃，体现"日程完成得好，宠物也开心"
- **WHEN** 宠物在 `calendar-cell` Zone 内且该日完成度低（< 50%）
- **THEN** 宠物 SHALL 以较慢速度贴底边行走（25px/s）并呈现懒散情绪（idle_variant），不跳跃，体现"日程完成少，宠物也提不起劲"

#### Scenario: Rest behavior takes precedence
- **WHEN** 宠物同时处于 `pet-spot` Zone（小窝）与 `calendar-cell` Zone 重叠区域
- **THEN** 进窝休息行为 SHALL 优先于格内互动（宠物先休息，不进入格内状态机）

### Requirement: 移动与动作联动
宠物移动中 SHALL 呈现 `walk` 动作（步伐动画），移动完成回到 `idle`（或 `sleep` 若在休息中）；格内互动期间 SHALL 使用 `pace` 作为基底动作。

#### Scenario: Walking while moving
- **WHEN** 宠物开始移动（游走/格内贴边设置新目标）
- **THEN** action 切换为 `walk`，步伐动画播放

#### Scenario: Idle on arrival
- **WHEN** 移动完成（到达目标位置）
- **THEN** action 回 `idle`；若处于休息中则回 `sleep`；若处于格内互动中则回 `pace`

#### Scenario: Pacing inside cell
- **WHEN** 宠物处于格内互动中且非贴边移动/跳跃
- **THEN** action 为 `pace`（格内站立呼吸基底），walk/jump 覆盖具体运动
