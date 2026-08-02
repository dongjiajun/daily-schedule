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
