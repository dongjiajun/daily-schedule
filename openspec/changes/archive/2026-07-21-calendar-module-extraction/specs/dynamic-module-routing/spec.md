# Dynamic Module Routing

`App.tsx` 基于 `moduleRegistry.getRoutes()` 动态组装路由，不再硬编码模块路由。

## ADDED Requirements

### Requirement: Route Assembly from ModuleRegistry

`App.tsx` SHALL 使用 `moduleRegistry.getRoutes()` 动态生成路由，替代硬编码的 `<HomePage />`。

- `moduleRegistry.getRoutes()` SHALL 在渲染时调用
- 返回的 `RouteObject[]` SHALL 直接展开为 `<Route>` 子元素
- `App.tsx` SHALL NOT 直接 import `HomePage` 或任何模块页面组件
- AuthGuard + AppShell 包裹结构 SHALL 保持不变

#### Scenario: 日历模块路由自动装配

- **WHEN** 日历模块已注册且用户访问 `/`
- **THEN** React Router SHALL 使用 `moduleRegistry.getRoutes()` 中的 index route
- **THEN** 日历 HomePage SHALL 被渲染（与迁移前行为一致）

#### Scenario: 无模块注册时路由为空

- **WHEN** `moduleRegistry.getAll()` 返回空数组
- **THEN** `moduleRegistry.getRoutes()` SHALL 返回空数组
- **THEN** AppShell SHALL 渲染空白内容区（无 404 错误）

#### Scenario: 多模块路由共存

- **WHEN** 同时注册日历模块（index route）和任务模块（path: `/tasks`）
- **THEN** `moduleRegistry.getRoutes()` SHALL 返回两条路由
- **THEN** `/` SHALL 渲染日历页面
- **THEN** `/tasks` SHALL 渲染任务页面

### Requirement: Module Routes via React Router Lazy Loading

每个模块的路由 SHALL 使用 React Router 7 的 `lazy()` 实现代码分割。

- 模块路由的 `lazy` 函数 SHALL 返回 `{ Component }` 对象
- 每个模块的 HomePage SHALL 被独立 code-split

#### Scenario: 日历模块代码分割

- **WHEN** 用户首次访问 `/`
- **THEN** 日历模块的 JS bundle SHALL 被独立加载
- **THEN** 其他未注册/未访问模块的代码 SHALL NOT 被加载

### Requirement: OnboardingOverlay Remains in App.tsx

`OnboardingOverlay` SHALL 保留在 `App.tsx` 中，但从 `@/modules/calendar/store/calendarStore` 导入状态。

- `OnboardingOverlay` 的 UI 和行为 SHALL 不变
- `showOnboarding`、`openOnboarding`、`closeOnboarding` SHALL 通过更新后的 import 路径获取

#### Scenario: 引导流程功能不变

- **WHEN** 用户首次登录（localStorage 无 `onboarding_done`）
- **THEN** OnboardingOverlay SHALL 自动显示
- **THEN** 关闭后 SHALL 设置 `onboarding_done` 标记
