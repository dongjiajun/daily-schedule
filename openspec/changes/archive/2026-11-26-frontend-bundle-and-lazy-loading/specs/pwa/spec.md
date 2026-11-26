# PWA

## MODIFIED Requirements

### Requirement: Service Worker with Precaching

Vite 构建 SHALL 通过 `vite-plugin-pwa` 生成 Service Worker（`registerType: 'autoUpdate'`）并预缓存核心静态资源。

- App Shell、CSS、入口与核心 vendor 分片及模块路由分片 SHALL 被写入构建期预缓存清单
- 低频节日粒子分片（`vendor-tsparticles`、`FireworkEffect`、`LanternFallEffect` 及 `@tsparticles` 子分片）SHALL 经 `workbox.globIgnores` 排除出首次安装预缓存，依托运行时 `CacheFirst` 静态资源规则按需缓存

#### Scenario: 首次访问后离线可用

- **WHEN** 用户首次访问应用（在线）
- **THEN** Service Worker SHALL 注册并预缓存核心静态资源（App Shell、CSS、核心与路由分片）
- **WHEN** 用户断网后再次访问核心页面（`/`、`/todo`、`/pet`）
- **THEN** 应用 SHALL 从缓存加载并正常显示

#### Scenario: 新版本自动更新

- **WHEN** 服务端部署新版本
- **THEN** Service Worker SHALL 检测到更新
- **THEN** 新版本 SHALL 自动下载并在下次访问时激活

#### Scenario: 首次安装跳过粒子引擎预缓存并按需运行时缓存

- **WHEN** 检查构建生成的 `dist/sw.js` 预缓存清单
- **THEN** `precacheAndRoute` 清单 SHALL 保留 Workbox 默认忽略规则并排除 `vendor-tsparticles`、`FireworkEffect`、`LanternFallEffect` 与 `@tsparticles` 相关子分片
- **WHEN** 节日触发粒子特效在线请求对应 `.js` 分片
- **THEN** Service Worker 运行时 `CacheFirst` 静态资源策略 SHALL 在首次加载后缓存该分片供后续复用
