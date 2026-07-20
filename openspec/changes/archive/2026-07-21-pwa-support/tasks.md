# Tasks: PWA Support

纯前端 PWA 配置，无后端/数据库/API 变更。

## 1. 依赖安装

- [x] 1.1 安装 `vite-plugin-pwa` 到 frontend devDependencies：`pnpm --filter frontend add -D vite-plugin-pwa`
- [x] 1.2 验证：`pnpm install` 无错误，`node_modules/vite-plugin-pwa` 存在

## 2. PWA 图标

- [x] 2.1 准备/生成 `public/pwa-192x192.png`（192×192，蓝色系品牌图标）
- [x] 2.2 准备/生成 `public/pwa-512x512.png`（512×512，蓝色系品牌图标）
- [x] 2.3 验证：两个图标文件存在且尺寸正确

## 3. Vite PWA 配置

- [x] 3.1 更新 `frontend/vite.config.ts`：新增 `VitePWA` 插件配置
  - `registerType: 'autoUpdate'`
  - manifest 含 name/short_name/start_url/display/theme_color/background_color/icons
  - workbox runtimeCaching：静态资源 CacheFirst + API NetworkOnly
  - devOptions: `{ enabled: false }`（开发环境禁用 SW）
- [x] 3.2 验证：`cd frontend && pnpm run build` 成功，dist 目录含 `sw.js` 和 `manifest.webmanifest`

## 4. 验证

- [x] 4.1 `cd frontend && pnpm run lint` 零错误
- [x] 4.2 `cd frontend && pnpm run build` 构建成功，dist 中 sw.js 存在
- [x] 4.3 `cd frontend && pnpm run test` 全部通过
- [x] 4.4 手动验证：`pnpm run preview` 启动生产预览，Chrome DevTools → Application → Manifest 正确显示
- [x] 4.5 手动验证：Service Worker 注册成功（Application → Service Workers）
- [x] 4.6 手动验证：离线访问时 UI 框架正常展示

## 5. 文档

- [x] 5.1 更新 `docs/architecture.md`（PWA 支持说明）
- [x] 5.2 更新 `CLAUDE.md`（PWA 配置位置 + 离线测试方法）
- [x] 5.3 更新 `docs/execution-plan.md`：M0.4 PWA 部分标记完成
