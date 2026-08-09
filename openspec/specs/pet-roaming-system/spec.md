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

#### Scenario: 回窝移动时长上限
- **WHEN** 宠物处于休息/夜间回窝的移动中（目标为小窝中心）
- **THEN** 单次移动动画时长 SHALL ≤ 11s（休息档约 4-11s，慢于正常档 3-8s 但可感知），保证用户等待体验与自动化测试断言的确定性

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

### Requirement: 宠物在日历格子内 SHALL 呈现物理质感的互动（贴边行走 / 重力落地 / 吸附落定 / 偶尔跳跃），替代直线往返：进入格子后重力下落至底边吸附点（enter 落地），沿四边吸附点**连续绕行**（含四角转角衔接，不斜穿格子内部），贴边停留期间位置稳定不漂移，接近吸附点时加速滑入并精确吸附落定，快风格下偶尔贴边跳跃（sin 抛物线）后落回继续绕行。

#### Scenario: 贴边行走
- **WHEN** 宠物进入 `calendar-cell` Zone 且状态为 walk
- **THEN** 沿格子四边吸附点**连续**行走（含四角转角点衔接，绕边不回头），每段移动都在边上，不斜穿格子内部、不离开格子范围

#### Scenario: 进入格子重力落地
- **WHEN** 宠物进入 `calendar-cell` Zone（enter 状态）
- **THEN** 宠物 SHALL 从格子上方向最近底边吸附点重力下落（垂直下沉），落定后精确吸附于底边线并产生小弹跳

#### Scenario: 贴边停留不漂移
- **WHEN** 宠物在格内处于 cling/吸附停留状态（任意边）
- **THEN** 停留期间位置 SHALL 保持稳定（顶边停留不被拖向底部，侧边停留不上下漂移），直至停留结束走向下一吸附点

#### Scenario: 吸附滑入与落定
- **WHEN** 宠物接近目标吸附点（距离 < 12px）
- **THEN** 宠物 SHALL 加速滑入（速度 ×1.6）并精确吸附于目标点，落定瞬间呈现微小下沉回弹（"哒"地吸住感）

#### Scenario: 到达点概率分流
- **WHEN** 宠物到达某条边的吸附点
- **THEN** 40% 概率触发贴边跳跃（sin 抛物线，0.6s 落回后继续走向下一段），30% 概率短暂停留（0.3-0.6s），30% 概率直接续走下一段——保持绕圈连续，不每点必停

#### Scenario: 贴边跳跃
- **WHEN** 格内完成度 ≥ 50% 且状态为 hop
- **THEN** 跳跃期间 action 为 `jump`（复用跳跃动画与影子变化），落地后继续沿边绕行（不落入 cling 长停留）

#### Scenario: 低完成度慢风格
- **WHEN** 格内完成度 < 50%
- **THEN** 同样绕行完整四边（顶边/倒立可见），但速度放缓（25px/s）、不跳跃、停留更长、情绪懒散（idle_variant）——差异在节奏与情绪，不在路径范围

### Requirement: 格内物理互动 SHALL 由帧循环（rAF）驱动状态机（enter 落地 → cling → walk → {hop / 短暂 cling / 续走} → … → exit），仅在格内激活；离开格子 / 状态机绕完 2 圈 / 组件卸载 SHALL 强制退出并恢复游走。

#### Scenario: 进入格子启动帧循环
- **WHEN** 宠物进入 `calendar-cell` Zone
- **THEN** 启动 rAF 帧循环与格内状态机，action 切换为 `pace`，游走 tick 暂停

#### Scenario: 离开格子恢复游走
- **WHEN** 宠物位置移出格子范围或状态机完成
- **THEN** 取消帧循环，恢复随机漫步 tick

#### Scenario: 绕圈完成退出
- **WHEN** 格内互动绕边走完 2 圈（完整两遍四边）
- **THEN** 状态机自然完成并退出，恢复游走；上限 45s 兜底强制退出（防路径退化卡死，且须大于大格子 2 圈预估时长）

#### Scenario: 组件卸载清理
- **WHEN** RoamingPet 卸载
- **THEN** 取消帧循环，无残留定时器
