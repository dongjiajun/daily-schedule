# Design: PWA Support

## Context

当前应用是纯 Web SPA，无离线支持，无 PWA 安装能力。执行计划 M0.4 要求添加 PWA 支持（manifest + Service Worker）。

**技术选型**：执行计划 D6 已锁定 `vite-plugin-pwa`（Vite 标准方案）。

**约束**：
- 不影响现有构建流程
- Service Worker 不应缓存用户私有数据（JWT 安全考虑）
- 仅前端变更

## Goals / Non-Goals

**Goals:**
- PWA manifest 配置（名称、图标、主题色、显示模式）
- Service Worker 预缓存静态资源
- 离线时显示 UI 框架 + 离线提示
- 自动更新（用户无需手动刷新）

**Non-Goals:**
- 不实现离线数据同步
- 不实现推送通知（已有 SSE）
- 不缓存用户数据 API 响应

## Decisions

### Decision 1: PWA 插件 — vite-plugin-pwa

- **选择**: `vite-plugin-pwa`（基于 Workbox）
- **理由**: 执行计划 D6 决策；Vite 生态标准方案；自动生成 Service Worker；支持 precaching + runtimeCaching 配置
- **备选方案**: 手写 Service Worker — 维护成本高，Workbox 集成复杂

### Decision 2: 注册策略 — autoUpdate

- **选择**: `registerType: 'autoUpdate'`
- **理由**: 用户无需手动点击"刷新"按钮；新版本在后台下载，下次访问自动激活；适合每日使用的工具型应用
- **备选方案**: `prompt` — 需要用户确认更新，体验差

### Decision 3: API 缓存策略

- **选择**: 静态资源 Cache First，API Network Only
- **理由**:
  - 静态资源（JS/CSS/字体/图片）变更少，Cache First 确保离线可用
  - API 返回用户私有数据（JWT 保护），不应缓存到 Service Worker 中（安全考虑）
  - 离线时展示缓存 UI + 离线提示，而非过期数据
- **备选方案**: API Stale While Revalidate — 可能在离线时展示过期数据，且缓存的 API 响应可能包含其他用户数据（安全风险）

### Decision 4: 图标生成

- **选择**: 使用 SVG 转 PNG 工具生成 192×192 和 512×512 两个尺寸
- **理由**: 简单直接，无需引入额外依赖；两个尺寸满足 Chrome/Edge/Safari PWA 安装要求
- **备选方案**: 使用 `@vite-pwa/assets-generator` — 自动生成多尺寸，但图标源文件需为 SVG

## Implementation

### vite.config.ts 配置

```typescript
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
    manifest: {
      name: '日程管理系统',
      short_name: '日程',
      start_url: '/',
      display: 'standalone',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /\.(?:js|css|woff2?|png|svg|ico)$/,
          handler: 'CacheFirst',
        },
        {
          urlPattern: /^\/api\/v1\/.*/,
          handler: 'NetworkOnly',
        },
      ],
    },
  }),
],
```

### 目录结构

```
frontend/
├── public/
│   ├── manifest.json          # 由 VitePWA 插件自动生成
│   ├── pwa-192x192.png        # PWA 小图标
│   └── pwa-512x512.png        # PWA 大图标
└── vite.config.ts             # 新增 VitePWA 插件配置
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Service Worker 缓存旧版本导致用户看不到更新 | `autoUpdate` 策略自动检测并激活新版本 |
| 开发环境 SW 干扰调试 | 开发环境默认不启用 PWA（`devOptions: { enabled: false }`） |
| API 响应被意外缓存导致数据泄露 | Network Only 策略排除所有 `/api/v1/` 请求 |

## Open Questions

1. **是否需要自定义离线页面？** — v1 使用浏览器默认离线页。未来可在 `public/offline.html` 中自定义。
