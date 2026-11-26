# Dynamic Module Routing

`App.tsx` 基于 `moduleRegistry.getRoutes()` 动态组装路由，不再硬编码模块路由。

## Purpose

消除 `App.tsx` 对具体模块页面组件的硬编码依赖，使路由由 `ModuleRegistry` 统一管理，支持模块的即插即用。

## Requirements

### Requirement: Route Assembly from ModuleRegistry

`App.tsx` SHALL 使用 `moduleRegistry.getRoutes()` 动态生成路由，替代硬编码的 `<HomePage />`。

- `moduleRegistry.getRoutes()` SHALL 在渲染时调用
- 返回的 `RouteObject[]` SHALL 通过 `useRoutes()` 渲染
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

### Requirement: 全站通知常驻与分层键盘快捷键及无障碍引导

`AppShell` SHALL 挂载 `useSseNotifications` 与全局 `?` 快捷键（`useGlobalShortcuts`）以保持跨页面 SSE 连接与帮助弹框可用；`TodoPage` SHALL 支持 `N`（新建任务）与 `1`/`2`（看板/列表切换）；`OnboardingGuide` SHALL 基于 Radix `Dialog` 实现焦点捕获与 `Esc` 关闭。

#### Scenario: 跨模块切页保持 SSE 连接与分层快捷键响应

- **WHEN** 用户从 `/` 切换到 `/todo` 或 `/pet` 并按 `?`，或在 `/todo` 按 `N` / `1` / `2`
- **THEN** SSE 通知订阅持续保持不断连，按 `?` 打开分组快捷键帮助框，`/todo` 内 `N` 打开新建任务弹窗、`1`/`2` 切换看板与列表视图

#### Scenario: 输入框聚焦或弹窗打开时屏蔽快捷键且引导支持 Esc 关闭

- **WHEN** 焦点在输入框内或存在 `[role="dialog"]` 打开时触发全局/模块快捷键，或打开 `OnboardingGuide` 后按下 `Escape`
- **THEN** 快捷键被屏蔽不误触新建或切视图；`OnboardingGuide` 作为 Radix `Dialog` 捕获焦点并响应 `Escape` 关闭引导
