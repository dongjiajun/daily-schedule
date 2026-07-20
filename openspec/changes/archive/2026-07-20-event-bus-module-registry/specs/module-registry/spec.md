# Module Registry

模块注册中心，管理模块的定义、注册、注销与查询，支撑插件式架构的模块生命周期。

## ADDED Requirements

### Requirement: ModuleDefinition Interface

frontend SHALL 定义 `ModuleDefinition` 接口，描述模块的完整声明。

- `id` MUST 为唯一字符串标识
- `name` MUST 为显示名称
- `description` MUST 为模块描述
- `icon` MUST 为 React 组件类型（用于侧边栏渲染）
- `order` MUST 为侧边栏排序权重（数字越小越靠前）
- `routes` MUST 为 React Router `RouteObject[]`（延迟加载）
- `stores` MAY 为 Zustand store 映射（key → StateCreator）
- `onInit` MAY 为模块初始化回调
- `onDestroy` MAY 为模块销毁回调
- `petActions` MAY 为宠物行为声明数组

#### Scenario: 模块声明完整定义

- **WHEN** 日历模块注册 `{ id: 'calendar', name: '日程', order: 1, routes: [...], onInit: () => {...} }`
- **THEN** TypeScript SHALL 验证必填字段存在
- **THEN** ModuleRegistry SHALL 接受并存储该定义

#### Scenario: 模块声明宠物行为

- **WHEN** 模块声明 `petActions: [{ eventType: 'event:completed', description: '完成日程' }]`
- **THEN** ModuleRegistry SHALL 存储 petActions 供宠物系统后续查询

### Requirement: ModuleRegistry Class

frontend SHALL 提供 `ModuleRegistry` 类，管理所有已注册模块。

- `register(def)` MUST 注册模块并返回注销函数
- `unregister(id)` MUST 移除已注册的模块
- `get(id)` MUST 返回指定模块定义或 undefined
- `getAll()` MUST 返回所有已注册模块（按 order 排序）
- `getRoutes()` MUST 收集并返回所有模块的 routes
- `getPetActions()` MUST 收集并返回所有模块的 petActions
- 重复注册相同 `id` SHALL 抛出错误

#### Scenario: 注册模块

- **WHEN** 调用 `moduleRegistry.register(calendarModule)`
- **THEN** ModuleRegistry SHALL 存储该模块
- **THEN** 返回的注销函数 SHALL 可在后续调用以移除该模块

#### Scenario: 重复注册检测

- **WHEN** 对同一 `id` 调用 `register()` 两次
- **THEN** 第二次调用 SHALL 抛出 Error
- **THEN** Error message SHALL 包含重复的 `id`

#### Scenario: 获取所有模块路由

- **WHEN** 已注册日历模块（routes: [calendarRoute]）和任务模块（routes: [kanbanRoute, listRoute]）
- **THEN** `getRoutes()` SHALL 返回 `[calendarRoute, kanbanRoute, listRoute]`
- **THEN** 路由 SHALL 按模块注册顺序扁平化

#### Scenario: 按 order 排序

- **WHEN** 注册模块 A（order: 3）和模块 B（order: 1）
- **THEN** `getAll()` SHALL 返回 `[B, A]`（order 升序）

### Requirement: Frontend ModuleRegistry Singleton

frontend SHALL 在 `core/lib/moduleRegistry.ts` 中创建并导出 ModuleRegistry 的单例实例。

- 单例 SHALL 为 `export const moduleRegistry = new ModuleRegistry()`
- 应用启动时 SHALL 通过此单例注册所有模块

#### Scenario: 应用启动注册模块

- **WHEN** `main.tsx` 中 `moduleRegistry.register(calendarModule)`
- **THEN** 模块注册中心 SHALL 包含日历模块
- **THEN** `App.tsx` SHALL 通过 `moduleRegistry.getRoutes()` 获取所有路由

## Test Coverage

| Scenario | 测试方式 | 状态 |
|----------|---------|------|
| 模块声明完整定义 | TypeScript 类型检查 + 单元测试 | ➕ |
| 注册模块 | ModuleRegistry 单元测试 | ➕ |
| 重复注册检测 | ModuleRegistry 单元测试 | ➕ |
| 获取所有模块路由 | ModuleRegistry 单元测试 | ➕ |
| 按 order 排序 | ModuleRegistry 单元测试 | ➕ |
| 应用启动注册模块 | 集成测试 / 手动验证 | ➕ |
