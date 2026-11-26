# Dynamic Module Routing

## MODIFIED Requirements

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

## ADDED Requirements

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
