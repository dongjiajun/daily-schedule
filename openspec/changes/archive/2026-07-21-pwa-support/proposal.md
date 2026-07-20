# Proposal: PWA Support

## Why

日程管理系统是用户每日使用的工具，应支持离线访问和桌面安装。PWA 能力让用户无需打开浏览器输入 URL，像原生应用一样从桌面/主屏幕一键打开。

## What Changes

- 安装 `vite-plugin-pwa` + `workbox-precaching` 依赖
- 配置 `vite.config.ts`：PWA 插件 + manifest + Service Worker 预缓存策略
- 创建 `public/manifest.json`：PWA 清单（名称、图标、主题色、显示模式）
- 生成 PWA 图标（192px + 512px PNG）
- Service Worker 预缓存静态资源 + 运行时 API 缓存策略

## Capabilities

### New Capabilities

- `pwa`: 渐进式 Web 应用 — manifest + Service Worker + 离线缓存

### Modified Capabilities

无

## API Contract Impact

无。

## DDD Layer Impact

无。

## Database Impact

无。

## Impact

### 新增/修改文件

| 文件 | 说明 |
|------|------|
| `frontend/vite.config.ts` | 新增 `VitePWA` 插件配置 |
| `frontend/public/manifest.json` | PWA 清单 |
| `frontend/public/pwa-192x192.png` | PWA 小图标 |
| `frontend/public/pwa-512x512.png` | PWA 大图标 |
| `frontend/package.json` | 新增 `vite-plugin-pwa` devDependency |

### 依赖

- `vite-plugin-pwa` — Vite PWA 插件（Vite 标准方案，执行计划 D6 推荐）
- `workbox-precaching` / `workbox-routing` — Service Worker 缓存策略（随 vite-plugin-pwa 自动引入）
