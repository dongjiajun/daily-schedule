# Proposal: frontend-bundle-and-lazy-loading

## Why
当前前端 `dist/assets/index-*.js` 打包为约 1.30 MB（gzip 约 407 kB）的单一入口产物：三个功能模块页面（`HomePage`、`TodoPage`、`PetPage`）及依赖 `tsparticles` 的节日粒子特效（`FireworkEffect`、`LanternFallEffect`）均以同步静态导入进入首屏，且未配置 Vite 8 Rolldown vendor 分片；同时 `vite-plugin-pwa` 将粒子引擎一并写入 Service Worker 首次预缓存，影响首屏加载体积与按需缓存效率。

## What Changes
- 模块路由页面改用 `React.lazy()` 按需代码分割，并在 `AppShell` 中为 `<Outlet />` 包裹路由级 `<ErrorBoundary key={pathname}>` 与基于设计 token `Skeleton` 的 `<Suspense>` 加载态占位，同时保留 `BrowserRouter` + `useRoutes()` + `moduleRegistry.getRoutes()` 既有架构与不中断的行为。
- `EffectLayer` 中依赖 `@tsparticles/react` / `tsparticles` 的 `FireworkEffect` 与 `LanternFallEffect` 改为 `React.lazy()` 按需加载，包裹 `<Suspense fallback={null}>` 与本地静默错误边界，非粒子日/纯 CSS 特效日不加载粒子引擎。
- 在 `frontend/vite.config.ts` 中配置 Vite 8 Rolldown `build.rolldownOptions.output.codeSplitting.groups`，将核心运行时/状态/Radix/动画/日历库/粒子引擎拆分为独立缓存分片。
- 调整 `vite-plugin-pwa` 的 `workbox.globIgnores`，将低频粒子分片（`vendor-tsparticles`、`FireworkEffect`、`LanternFallEffect` 及 `@tsparticles` 子分片）排除出首次安装 SW 预缓存清单，依托既有运行时 `CacheFirst` 规则在触发时按需缓存；核心 App Shell 与模块路由分片继续预缓存。
- 非破坏性变更（无 **BREAKING** 变更）。

## Capabilities

### New Capabilities
（无新增独立 capability；全部通过修改现有 capability delta 表达）

### Modified Capabilities
- `dynamic-module-routing`: 将模块路由懒加载方式更新为 `React.lazy()` + `AppShell` `<Suspense>`/`<ErrorBoundary key={pathname}>`，并新增 Vite 8 Rolldown 前端产物分片与首屏包体收敛需求。
- `holiday-effects`: 新增重型粒子特效（`FireworkEffect`、`LanternFallEffect`）按需懒加载与失败静默降级需求。
- `pwa`: 更新 `Service Worker with Precaching` 需求，明确排除低频粒子特效分片出首次安装预缓存清单，改由运行时 `CacheFirst` 按需缓存。

## API Contract Impact
无（不修改 `specs/openapi.yaml`，无新增或变更后端端点）。

## DDD Layer Impact
无后端变更（仅影响 `frontend/` 构建配置、核心壳层/特效层、模块路由声明、单元测试与前端文档）。

## Database Impact
无需 Flyway 迁移，不涉及数据库表/列变更。

## Workflow Schema Choice
采用默认 `spec-driven-custom-standard`（`proposal -> specs -> design -> tasks`，无 `test-plan`）：本变更涉及跨模块路由懒加载、Vite 8 Rolldown 构建分片与 PWA 预缓存策略调整，需要设计文档权衡架构与分片优先级，但不涉及 API 契约/数据库迁移或高风险业务状态机重构，符合 standard 档定位。

## Impact
- 路由与壳层：`frontend/src/modules/{calendar,todo,pet}/routes.tsx`、`frontend/src/components/layout/AppShell.tsx`
- 特效懒加载：`frontend/src/core/components/effects/EffectLayer.tsx`
- 构建与 PWA：`frontend/vite.config.ts`
- 测试与文档：`frontend/src/**/__tests__/`、`docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`
