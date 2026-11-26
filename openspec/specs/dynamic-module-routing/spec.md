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

每个模块的路由页面（`HomePage`、`TodoPage`、`PetPage`）SHALL 使用 `React.lazy()` 实现按需代码分割，由 `AppShell` 内的 `Suspense`（以设计 token `Skeleton` 且 `role="status"` 作为加载占位）与路由级 `ErrorBoundary`（`key={pathname}`）包裹渲染，同时保留 `BrowserRouter` + `useRoutes()` + `moduleRegistry.getRoutes()` 既有装配方式。

#### Scenario: 日历模块代码分割

- **WHEN** 用户首次访问 `/`
- **THEN** 日历模块的 JS bundle SHALL 被独立加载
- **THEN** 其他未注册/未访问模块的代码 SHALL NOT 被加载

#### Scenario: 跨模块导航按需加载并展示骨架占位

- **WHEN** 用户从 `/` 导航至 `/todo` 或 `/pet`
- **THEN** 目标模块的页面 JS 分片 SHALL 按需加载并展示对应视图
- **THEN** 异步加载等待期间 `AppShell` SHALL 渲染带 `role="status"` 的 `Skeleton` 占位

#### Scenario: 异步路由分片加载或渲染异常时降级恢复

- **WHEN** 某路由异步分片加载失败或页面组件抛出异常
- **THEN** 路由级 `ErrorBoundary` SHALL 捕获异常并渲染「页面出现错误」与「重新加载」恢复界面（`Sidebar` 等壳层保持可用）
- **WHEN** 用户切换到其他正常路由路径（`pathname` 变化）
- **THEN** 路由级 `ErrorBoundary` 因 `key={pathname}` 重置并恢复正常渲染

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

### Requirement: 前端产物分片与首屏包体收敛

Vite 8 Rolldown 构建的 `output.codeSplitting` SHALL 按职责与优先级拆分核心运行时（`vendor-react`）、状态管理（`vendor-state`）、UI 原语（`vendor-radix`）、动画（`vendor-motion`）、日历组件库（`vendor-calendar`）与粒子引擎（`vendor-tsparticles`），使首屏入口产物不静态包含未访问路由与粒子引擎代码。

#### Scenario: 首屏入口不静态引入粒子引擎与跨模块页面分片

- **WHEN** 执行前端生产构建（`vite build`）检查 `dist/index.html` 与入口 `assets/index-*.js`
- **THEN** `vendor-react`、`vendor-state`、`vendor-radix`、`vendor-motion`、`vendor-calendar` 与 `vendor-tsparticles` SHALL 输出为独立分片
- **THEN** `dist/index.html` 与入口 JS SHALL NOT 静态导入或预加载 `vendor-tsparticles`、`TodoPage` 与 `PetPage`

#### Scenario: 高优先级核心组防止叶分组反向捕获共享依赖

- **WHEN** Rolldown 默认开启 `includeDependenciesRecursively` 执行分片捕获
- **THEN** `vendor-react` 等核心基础组 SHALL 拥有高于 `vendor-calendar`、`vendor-tsparticles` 的优先级
- **THEN** `react`、`react-dom` 等共享核心依赖 SHALL NOT 被反向捕获进按需或粒子分片
