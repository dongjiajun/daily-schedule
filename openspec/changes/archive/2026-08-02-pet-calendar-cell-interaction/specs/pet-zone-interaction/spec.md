# Pet Zone Interaction

## MODIFIED Requirements

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
