# Pet Roaming System

## MODIFIED Requirements

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

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| Roam cadence survives re-render | RoamingPet.test.tsx | 渲染不重排游走 timer | ➕ |
| Approach cursor area（保鲜期/惰性衰减） | zoneRegistry.test.ts + RoamingPet.test.tsx | 惰性过期回归 | ➕ |
