# Pet Zone Interaction

区域感知机制 — 宠物感知页面上的类型化区域（Zone），驱动游走与互动行为。

## Purpose

通过类型化区域模型与注册机制，让宠物感知页面上的兴趣区域（用户交互、宠物专属区域、日历格子），驱动游走吸引与后续互动行为，实现模块间松耦合联动。

## Requirements

### Requirement: Zone Model
宠物系统 SHALL 提供类型化区域模型 `Zone`，替代单一的兴趣点（`InterestPoint`）表示。

#### Scenario: Zone carries type and data
- **WHEN** 前端注册一个区域
- **THEN** Zone SHALL 包含矩形边界（left/top/right/bottom）、类型标识和数据负载（payload）
- **THEN** 支持的 Zone 类型 SHALL 至少包含 `user-interaction`（用户交互）、`pet-spot`（宠物专属区域）、`calendar-cell`（日历格子），后续类型可扩展

#### Scenario: Zone with completion payload
- **WHEN** 注册 `calendar-cell` 类型 Zone
- **THEN** payload SHALL 携带当天日程完成度（completed/total 或百分比），供展示层消费
- **THEN** 完成度口径 SHALL 为当天事件中 `COMPLETED` 状态的数量占比（无事件当天为 0 或 N/A，由调用方决定）

### Requirement: Zone Registry
宠物系统 SHALL 提供区域注册表，管理 Zone 的生命周期（注册/更新/移除）。

#### Scenario: Register and remove zone
- **WHEN** 外部模块（calendar/pet-status-panel）注册或移除 Zone
- **THEN** 注册表 SHALL 同步更新，且移除后宠物不再感知该区域
- **THEN** 同一模块重复注册同一区域 SHALL 覆盖旧条目（key 为区域标识）

#### Scenario: Rect update is event-driven
- **WHEN** 页面滚动或视口尺寸变化使 Zone 矩形失效
- **THEN** 注册表 SHALL 通过事件驱动（scroll/resize 监听或模块显式刷新）更新矩形
- **THEN** 禁止使用全 body `MutationObserver` 监听更新（性能约束）

#### Scenario: Sidebar home spot registers pet-spot zone
- **WHEN** 宠物存在且 SidebarPet 区域挂载
- **THEN** 该区域 SHALL 注册为 `pet-spot` 类型 Zone（宠物小窝），携带矩形边界与权重
- **THEN** 组件卸载时 SHALL 注销该 Zone，宠物不再感知小窝
- **THEN** 滚动或视口尺寸变化时 SHALL 按事件驱动约束更新小窝矩形

#### Scenario: Calendar month view registers calendar-cell zones
- **WHEN** calendar 模块月视图渲染（月视图可见）
- **THEN** 每个可见日期格子 SHALL 注册为 `calendar-cell` 类型 Zone，key 含日期标识，payload 携带该日完成度
- **THEN** 视图切换（月→周/日/议程）或组件卸载时 SHALL 注销全部 calendar-cell Zones
- **THEN** 滚动或视口尺寸变化时 SHALL 按事件驱动约束更新格子矩形

### Requirement: Geometric Zone Detection
宠物进入/离开 Zone 的检测 SHALL 基于缓存的矩形做纯数学相交判断，不引入逐帧 DOM 查询。

#### Scenario: Enter detection follows roam cadence
- **WHEN** 宠物位置更新（游走循环 10-30s 节奏）
- **THEN** 检测 SHALL 使用 Zone 缓存矩形做相交判断（O(n) 遍历，n = 注册 Zone 数）
- **THEN** 不产生 `getBoundingClientRect` 调用

#### Scenario: Zone entry triggers behavior hooks
- **WHEN** 宠物进入某个 Zone
- **THEN** 引擎 SHALL 发出该 Zone 的进入事件（含类型与 payload），由上层模块决定行为（动画/气泡/模式切换）

#### Scenario: Home spot entry triggers rest behavior
- **WHEN** 宠物位置进入 `pet-spot` 类型 Zone（小窝）
- **THEN** 引擎 SHALL 发出进入事件（含 `pet-spot` 类型与 payload）
- **THEN** 宠物模块 SHALL 进入休息状态并停留于小窝内（不再继续随机漫步）

### Requirement: UI Wiring for User-Interaction Zones
宠物模块 SHALL 在 UI 层补齐兴趣区域触发接线（spec 契约的既有行为此前未实现）。

#### Scenario: Cursor dwell triggers zone
- **WHEN** 鼠标/手指在页面上停留 > 3 秒
- **THEN** 50% 概率创建 `user-interaction` Zone 并触发 `attracted` 模式
- **THEN** Zone 带衰减（decayTime），到期自动移除并恢复 `wandering`

#### Scenario: Click or input triggers zone
- **WHEN** 用户点击或输入
- **THEN** 30% 概率创建 `user-interaction` Zone
- **THEN** 宠物到达区域附近（ATTRACTION_DISTANCE 内）后停留 5-10s 再恢复漫步
