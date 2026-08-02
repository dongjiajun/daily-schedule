# Pet Zone Interaction

## MODIFIED Requirements

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

#### Scenario: Zone expiry is lazily evaluated on read
- **WHEN** 注册带 `decayTime` 与 `createdAt` 的 Zone，且自创建已超过保鲜期
- **THEN** 宠物感知（游走 tick 读取 Zone 列表）SHALL 不可见该 Zone——过期判定 SHALL 在读取时惰性执行，不依赖定时器硬删
- **THEN** 已过期的 Zone 条目 SHALL 在读取时被清理，不残留注册表
- **THEN** 未携带 `decayTime` 的 Zone（如 `pet-spot`、`calendar-cell`）SHALL 不过期

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| Zone expiry is lazily evaluated on read | zoneRegistry.test.ts | 惰性过期（超时后读取不可见+已清理）/ 无 decayTime 不过期 / 覆盖注册不误删 | ➕ |
