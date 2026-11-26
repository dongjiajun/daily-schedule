# Design: frontend-bundle-and-lazy-loading

## Context
- 前端基于 React 19 + React Router 7（`BrowserRouter` + `useRoutes()`）+ Zustand + React Query + Vite 8.1.5（Rolldown `1.0.0-rc.18`）+ `vite-plugin-pwa 1.3.0`。
- 当前 `frontend/src/modules/{calendar,todo,pet}/routes.tsx` 静态导入全部页面组件，`EffectLayer.tsx` 静态导入依赖 `@tsparticles/react` + `tsparticles` 的 `FireworkEffect` 和 `LanternFallEffect`，且 `frontend/vite.config.ts` 未配置 `build.rolldownOptions.output.codeSplitting`。
- 优化前构建产物集中在单个 `assets/index-*.js`（1,300.18 kB 原始 / 407.47 kB gzip），Workbox `dist/sw.js` 首次安装即预缓存粒子引擎与全部产物。
- 架构红线：`core/`、`components/layout/` 与 `modules/` 禁止跨区反向直接 import（`moduleBoundary.test.ts` 守卫）；`pnpm run ui:check` 禁止 TSX 裸色值与未批准几何/动效值。

## Goals / Non-Goals

**Goals:**
- 模块路由页面（`HomePage`、`TodoPage`、`PetPage`）实现 `React.lazy()` 按需拆分，未访问路由不随入口同步下载。
- 粒子特效（`FireworkEffect`、`LanternFallEffect`）实现 `React.lazy()` 按需加载，常规工作日/纯 CSS 特效日不加载 `tsparticles`，异常静默降级。
- 利用 Vite 8 Rolldown `codeSplitting` 拆分核心/状态/Radix/动画/日历/粒子分片，显著收敛首屏入口包体积并避免共享依赖反向污染。
- 配置 `workbox.globIgnores` 将 `tsparticles` 相关分片移出 SW 首次安装预缓存清单，保持核心与路由页面离线可用。

**Non-Goals:**
- 不迁移 `BrowserRouter` + `useRoutes()` 为 `createBrowserRouter`（Data Router）。
- 不调整后端 Java 代码、OpenAPI 契约、数据库表结构或小程序打包链路。
- 不修改各模块 `SidebarComponent` / `RoamingPet` / `SidebarPet` 的现有挂载模式（本阶段聚焦路由页面、特效层与 Vite/PWA 构建配置）。

## Decisions

### Decision 1: 路由级 `React.lazy()` + `AppShell` `<Suspense>` / `<ErrorBoundary key={pathname}>`
- **选择**: 保持 `BrowserRouter` + `useRoutes(moduleRegistry.getRoutes())` 架构不变；将 `calendar/routes.tsx`、`todo/routes.tsx`、`pet/routes.tsx` 中的 `HomePage`/`TodoPage`/`PetPage` 改为 `React.lazy()` 懒加载，并在 `AppShell.tsx` 内以 `<ErrorBoundary key={pathname}><Suspense fallback={<RouteFallback />}><Outlet /></Suspense></ErrorBoundary>` 包裹，其中 `RouteFallback` 使用设计系统 `Skeleton` 原语及 `role="status"`。
- **理由**: 对 `moduleRegistry`、`Sidebar` 路由匹配（读取 `m.routes[0].index/path`）与现有 `AppShell.test.tsx`/`App.test.tsx` 测试夹具完全兼容；`key={pathname}` 确保单页切路由后错误边界自动复位。
- **备选方案**: 迁移至 `createBrowserRouter` + `RouteObject.lazy`。成本高且需重写 `App.tsx`、路由守卫组合及大量单元测试 mock，收益与 `React.lazy()` 等价，故不采纳。

### Decision 2: `EffectLayer` 粒子特效懒加载 + 局部静默错误边界
- **选择**: 在 `EffectLayer.tsx` 内以 `React.lazy()` 延迟导入 `FireworkEffect` 与 `LanternFallEffect`，保留 4 个轻量纯 CSS 特效同步导入；在 `EffectLayer.tsx` 内定义私有 `SilentEffectBoundary`（配合 `key={effectType}` 与 `<Suspense fallback={null}>`）包裹粒子特效分支。
- **理由**: 既阻止 `@tsparticles/react`/`tsparticles` 进入入口 chunk，又严格遵守 `moduleBoundary.test.ts` 约束（`core/` 不得直接 import `components/layout/ErrorBoundary.tsx`）；断网或分片加载失败时静默返回 `null` 不影响日程/任务主流程。
- **备选方案**: 复用 `components/layout/ErrorBoundary` 或在 `App.tsx` 包裹全局边界。前者违反单向依赖且会把外层报错 UI 渲染在背景特效层，后者无法对背景特效静默降级。

### Decision 3: Vite 8 Rolldown `codeSplitting.groups` 优先级与精确包边界匹配
- **选择**: 使用 Vite 8 非废弃 API `build.rolldownOptions.output.codeSplitting.groups`，按优先级降序配置 `vendor-react`(60) > `vendor-state`(50) > `vendor-radix`(40) > `vendor-motion`(30) > `vendor-calendar`(25) > `vendor-tsparticles`(20)，并使用 `[\\/]node_modules[\\/]<pkg>[\\/]` 精确边界正则兼容 Windows 与 pnpm 结构；其中 `vendor-radix` 同时归并 `clsx`、`class-variance-authority`、`tailwind-merge` 等 UI 基础工具库，避免被 `vendor-calendar` 递归捕获。
- **理由**: Vite 8.1.5（Rolldown `1.0.0-rc.18`）中 `rollupOptions` 与 `advancedChunks` 均已标注 `@deprecated`，`codeSplitting.groups` 为推荐标准接口；`includeDependenciesRecursively` 默认为 `true`，高优先级核心组先捕获 `react`/`react-dom`/`react-router-dom` 可杜绝 `vendor-calendar` 或 `vendor-tsparticles` 反向吸纳 React；精确 `/[\\/]pkg[\\/]/` 边界避免误匹配 `react-big-calendar` 或 `react-dnd`。
- **备选方案**: 仅靠 `manualChunks` 函数或关闭 `includeDependenciesRecursively`。前者在 pnpm 虚拟存储与跨入口场景易触发环形 chunk，后者需要额外配置 `preserveEntrySignatures`/`strictExecutionOrder` 且更易出运行时顺序问题。

### Decision 4: `vite-plugin-pwa` `workbox.globIgnores` 排除粒子分片 + 运行时 `CacheFirst` 兜底
- **选择**: 在 `workbox` 配置中显式保留 Workbox 默认忽略项（`**/node_modules/**/*`、`sw.js`、`workbox-*.js`）并追加排除 `assets/vendor-tsparticles-*.js`、`assets/FireworkEffect-*.js`、`assets/LanternFallEffect-*.js`（若构建检查发现 `@tsparticles` 内部存在额外异步子分片如 `Container-*.js`/`LogUtils-*.js`，一并归并或排除），依赖既有 `runtimeCaching` 的 `CacheFirst`（匹配 `.js` 等静态资源）在激活粒子节日时按需缓存。
- **理由**: 覆盖 `globIgnores` 若不保留默认项会导致多预缓存 `workbox-*.js` 自身；排除粒子分片可削减首次 SW 预缓存下载量，同时保留 `/`, `/todo`, `/pet` 三大路由分片在预缓存清单内，离线核心功能不受影响。
- **备选方案**: 关闭 SW precache 或把路由页面也排除出 precache。若排除 `/todo` 与 `/pet` 分片会破坏已确立的「离线访问核心界面」PWA 契约。

## DDD Layer Design

### 领域层 (domain/)
不涉及（仅前端变更）。

### 基础设施层 (infrastructure/)
不涉及（仅前端变更）。

### 应用层 (application/)
不涉及（仅前端变更）。

### API 层 (api/)
不涉及（仅前端变更）。

### 前端 (frontend/src/ 与构建配置)
- `frontend/src/modules/{calendar,todo,pet}/routes.tsx`：`HomePage` / `TodoPage` / `PetPage` 改为 `React.lazy()` 动态导入。
- `frontend/src/components/layout/AppShell.tsx`：新增基于 `Skeleton` 的 `RouteFallback`，并用 `<ErrorBoundary key={pathname}><Suspense fallback={<RouteFallback />}><Outlet /></Suspense></ErrorBoundary>` 包裹路由出口；同步检查 `ErrorBoundary.tsx` 在容器内居中尺寸兼容性。
- `frontend/src/core/components/effects/EffectLayer.tsx`：`FireworkEffect` / `LanternFallEffect` 改为 `React.lazy()`，以局部 `SilentEffectBoundary` + `<Suspense fallback={null}>` 包裹。
- `frontend/vite.config.ts`：配置 `build.rolldownOptions.output.codeSplitting.groups` 与 `VitePWA.workbox.globIgnores`。

## API Design
无 API 变更；`specs/openapi.yaml` 与 `frontend/src/api/` 保持不变。

## Database Design
无数据库变更，无 Flyway 迁移。

## Risks / Trade-offs
- [Vitest 对 `EffectLayer` 粒子场景同步断言失效] → 将 `EffectLayer.test.tsx` 中烟花/灯笼断言改为异步 `findByTestId`，并补充 `prefers-reduced-motion` 与静默降级用例。
- [Rolldown `@tsparticles/engine` 内部分包仍生成匿名动态小 chunk（如 `Container-*.js`、`LogUtils-*.js`）] → 在 `vite build` 后直接脚本检查 `dist/assets/` 与 `dist/sw.js` 实际清单，若存在子分片则调整 group 匹配使其并入 `vendor-tsparticles` 或在 `globIgnores` 一并排除。
- [首次切页出现短暂加载骨架] → 使用语义化 `Skeleton` 原语避免白屏，同时核心路由分片继续保留在 SW 预缓存中使二次访问零等待。

## Review Checklist
- [x] 失败路径是否覆盖？ — 覆盖：路由分片加载/渲染失败由 `AppShell` `<ErrorBoundary key={pathname}>` 呈现恢复界面并在切页时自动复位；粒子分片加载/渲染失败由 `EffectLayer` `SilentEffectBoundary` 静默降级且不崩溃主页面。
- [x] 回滚/降级方案是什么？ — 可随时将 3 个 `routes.tsx` 与 `EffectLayer.tsx` 恢复为同步导入并移除 `vite.config.ts` 中 `codeSplitting`/`globIgnores` 配置，零后端/数据库/存储迁移成本。
- [x] 契约/DB 兼容性影响？ — 无影响：不修改 OpenAPI 契约、后端代码或数据库表结构；`localStorage` 持久化键与已有 URL 路由保持完全兼容。

## Migration Plan
1. 实现路由与粒子特效 `React.lazy()` + `AppShell` 边界与降级组件。
2. 配置 `frontend/vite.config.ts` 的 Rolldown `codeSplitting` 与 Workbox `globIgnores`，执行 `vite build` 核验 `dist/assets/`、`dist/index.html` 与 `dist/sw.js`。
3. 更新并补全 Vitest 单元测试，运行全量门禁、Playwright E2E 与生产预览 (`vite preview`) 验证。

## Open Questions
无（架构策略已在 `/grill-me` 与方案评审中全部敲定）。
