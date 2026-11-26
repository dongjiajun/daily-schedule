# Tasks: frontend-bundle-and-lazy-loading

<!--
  STANDARD 工作流（spec-driven-custom-standard）：1 实施 → 2 文档同步 → 3 全量验证，共三组。
  实施按 design.md 的 Decision 顺序、分 DDD 层落地，每层条目自带对应测试，不把测试堆到第 3 组。
  第 3 组后的 Workflow follow-up 为纯 bullet，不是 checkbox 任务。
-->

## 1. 实施
- [x] 1.1 数据库迁移：N/A（纯前端工程化/懒加载变更，不涉及数据库迁移或表结构调整）
- [x] 1.2 领域层 (`domain/`)：N/A（纯前端变更，不涉及后端领域层）
- [x] 1.3 基础设施层 (`infrastructure/`)：N/A（纯前端变更，不涉及后端基础设施层）
- [x] 1.4 应用层 (`application/`)：N/A（纯前端变更，不涉及后端应用层）
- [x] 1.5 API 层 (`api/`)：N/A（纯前端变更，不涉及后端 Controller/Assembler）
- [x] 1.6 契约同步：N/A（无 OpenAPI 契约与 SDK 变更）
- [x] 1.7 前端路由懒加载与壳层边界（Decision 1）：`frontend/src/modules/{calendar,todo,pet}/routes.tsx` 将 `HomePage`/`TodoPage`/`PetPage` 改为 `React.lazy()`；`AppShell.tsx` 添加设计 token `Skeleton` `RouteFallback`（`role="status"`）与 `<ErrorBoundary key={pathname}><Suspense><Outlet /></Suspense></ErrorBoundary>`（含 `ErrorBoundary.tsx` 容器适配及 `eslint.config.js` `routes.tsx` 规则例外）+ 更新 `AppShell.test.tsx` 与新增 `lazyRoutes.test.tsx`
- [x] 1.8 前端粒子特效按需懒加载与静默降级（Decision 2）：`EffectLayer.tsx` 将 `FireworkEffect`/`LanternFallEffect` 改为 `React.lazy()` 并以局部 `SilentEffectBoundary`（`key={effectType}`）+ `<Suspense fallback={null}>` 包裹 + 更新 `EffectLayer.test.tsx`（异步断言、`prefers-reduced-motion`、失败静默降级）
- [x] 1.9 Vite 8 Rolldown 分片与 PWA 预缓存调优（Decision 3 & 4）：在 `frontend/vite.config.ts` 配置 `build.rolldownOptions.output.codeSplitting.groups`（`vendor-react`/`vendor-state`/`vendor-radix` 含 `clsx`/`cva`/`tailwind-merge`/`vendor-motion`/`vendor-calendar`/`vendor-tsparticles`）及 `VitePWA.workbox.globIgnores`（保留默认忽略项 + 排除粒子分片）；执行 `vite build` 核验 `dist/assets/`、`dist/index.html` 与 `dist/sw.js` 实测数据（无共享依赖反向捕获、无粒子分片进入 `precacheAndRoute`）

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 更新 `AppShell`（`Suspense` + 路由级 `ErrorBoundary`）、`EffectLayer`（粒子特效懒加载 + 静默降级）、`ErrorBoundary` 容器尺寸及三模块 `routes.tsx` 懒加载说明
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 不涉及表/字段/领域模型（现有描述已核对仍准确）
- [x] 2.3 `docs/api/overview.md` — 不涉及端点/契约（现有描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 补充 Vite 8 Rolldown 分片、路由与粒子按需懒加载、PWA 排除粒子分片预缓存（运行时 `CacheFirst`）及同步最新前端 vitest 59 文件 314 用例与 `DOCS-CHECK: frontend-test-files=59` 声明
- [x] 2.5 `README.md` — 不涉及版本号或顶层功能清单变更（现有描述已核对仍准确）
- [x] 2.6 运行 `node scripts/docs-check.mjs` 与 `./scripts/sync-version.sh --check` — 文档与版本一致性检查通过

## 3. 全量验证
- [x] 3.1 `cd backend && mvn -s D:\self_maven_conf\settings.xml "-Dmaven.compiler.source=21" "-Dmaven.compiler.target=21" test` — 后端单元测试全部通过（354/354）
- [x] 3.2 `pnpm run verify` + `pnpm run ui:check` — 全 workspace lint + build + vitest 与 6 项设计 token 门禁全部通过
- [x] 3.3 `pnpm run test:e2e -- --workers=2` + `e2e/pet.spec.ts --workers=1` — 70/70 运行用例全部通过（另 1 条既有 skip；`e2e/pet.spec.ts` 补 `.rbc-calendar` 就绪等待）
- [x] 3.4 Production Preview Smoke test — 基于生产构建运行 `vite preview --port 4173` 浏览器实测：
  - [x] 登录并访问 `/`：控制台 0 报错，首屏仅加载壳层分片与 `HomePage`/`vendor-calendar`，未加载 `vendor-tsparticles`、`TodoPage`、`PetPage` 分片
  - [x] 导航至 `/todo` 与 `/pet`：按需加载对应页面分片并正常渲染，控制台 0 报错
- [x] 3.5 `pnpm run openspec:check` — OpenSpec 一致性 + 归档完整性通过

## Workflow follow-up
- `/opsx:verify` — 真实代码变更归档前必备（须报告无 CRITICAL）
- `/opsx:archive` — 用户确认后归档已完成的变更并独立 commit
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `node scripts/docs-check.mjs`
