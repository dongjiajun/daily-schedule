# frontend-bundle-and-lazy-loading

第二阶段前端包体积收敛与按需懒加载：三模块路由页面（`HomePage`/`TodoPage`/`PetPage`）改造为 `React.lazy()` 并在 `AppShell` 通过 `RouteFallback`（`Skeleton` + `role="status"`）与 `<ErrorBoundary key={pathname}>` 包裹 `<Outlet />`（含 `ErrorBoundary` 自适应容器与 `eslint.config.js` `routes.tsx` 规则）；`EffectLayer` 对重型粒子特效（`FireworkEffect`/`LanternFallEffect`）采用 `React.lazy()` + `SilentEffectBoundary` + `<Suspense fallback={null}>` 静默降级；`frontend/vite.config.ts` 配置 Vite 8 Rolldown `output.codeSplitting.groups` 拆分 `vendor-react`/`vendor-state`/`vendor-radix`/`vendor-motion`/`vendor-calendar`/`vendor-tsparticles` 与 `workbox.globIgnores` 排除粒子引擎预缓存；主入口 JS 产物由 `1,300.18 kB`（`407.47 kB` gzip）收敛至 `441.78 kB`（`144.39 kB` gzip）。

## 归档记录（2026-11-27）

- **verify 结论**：`spec-driven-custom-standard` 四工件完整，tasks 22/22 全部勾选，3 份 delta spec 全部实现并核对，**0 CRITICAL / 0 WARNING**（离线 SW 重载行为由 `dist/sw.js` 静态清单与运行时 `CacheFirst` 规则核对）。
- **门禁结果**：`pnpm run verify`（10/10 任务：`@daily-schedule/shared` 8 文件 117 用例 + `frontend` 59 文件 314 用例 + `@daily-schedule/miniprogram` 8 文件 86 用例）、`pnpm run ui:check`（6/6 项）、后端 `mvn test`（354/354）、Playwright `pnpm run test:e2e -- --workers=2`（69 passed / 1 pre-existing skip，并发抢跑 1 条经 `e2e/pet.spec.ts` 补 `.rbc-calendar` 等待后 `--workers=1` 8/8 通过）、`vite preview --port 4173` 生产预览浏览器冒烟，以及归档后复跑的 `pnpm run openspec:check`、`pnpm exec openspec validate --archived --strict --no-interactive`、`node scripts/docs-check.mjs` 与 `./scripts/sync-version.sh --check`（3.5.1）全部通过。
- **delta 同步**：3 份已有主 spec 完成合入（`dynamic-module-routing` MODIFIED 1 条 + ADDED 1 条；`holiday-effects` ADDED 1 条；`pwa` MODIFIED 1 条），主 spec 保持 72 份，delta 头 0 残留。
