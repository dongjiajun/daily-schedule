# PWA

渐进式 Web 应用支持 — manifest、Service Worker、离线缓存。

## ADDED Requirements

### Requirement: Web App Manifest

应用 SHALL 提供 `public/manifest.json`，符合 W3C Web App Manifest 规范。

- `name` MUST 为 `'日程管理系统'`
- `short_name` MUST 为 `'日程'`
- `start_url` MUST 为 `'/'`
- `display` MUST 为 `'standalone'`
- `theme_color` MUST 为 `'#3b82f6'`
- `background_color` MUST 为 `'#ffffff'`
- `icons` MUST 包含 192×192 和 512×512 两种尺寸的 PNG 图标

#### Scenario: 桌面端安装

- **WHEN** 用户在 Chrome/Edge 中访问应用并点击地址栏安装按钮
- **THEN** 浏览器 SHALL 弹出 PWA 安装提示
- **THEN** 安装后 SHALL 在桌面创建快捷方式

#### Scenario: 移动端添加到主屏幕

- **WHEN** 用户在移动端浏览器中访问应用
- **THEN** 浏览器 SHALL 显示"添加到主屏幕"提示
- **THEN** 添加后 SHALL 以 standalone 模式打开

### Requirement: Service Worker with Precaching

Vite 构建 SHALL 生成 Service Worker，预缓存静态资源。

- Service Worker SHALL 使用 `vite-plugin-pwa` 自动生成
- 构建产物（JS/CSS/HTML）SHALL 被预缓存
- `registerType` SHALL 为 `'autoUpdate'`（自动更新，无需用户手动刷新）

#### Scenario: 首次访问后离线可用

- **WHEN** 用户首次访问应用（在线）
- **THEN** Service Worker SHALL 注册并预缓存所有静态资源
- **WHEN** 用户断网后再次访问
- **THEN** 应用 SHALL 从缓存加载并正常显示

#### Scenario: 新版本自动更新

- **WHEN** 服务端部署新版本
- **THEN** Service Worker SHALL 检测到更新
- **THEN** 新版本 SHALL 自动下载并在下次访问时激活

### Requirement: Runtime API Caching Strategy

Service Worker SHALL 对 API 请求采用合理的缓存策略。

- 静态资源（JS/CSS/字体/图片）SHALL 使用 Cache First
- 对用户数据（`/api/v1/events` 等）SHALL NOT 缓存（Network Only）
- 离线时 SHALL 展示缓存的 UI 框架，数据区域显示离线提示

#### Scenario: 离线访问日历

- **WHEN** 用户在离线状态下打开应用
- **THEN** 应用 UI 框架（侧边栏、工具栏）SHALL 从缓存正常加载
- **THEN** 日历数据区域 SHALL 显示离线提示

### Requirement: PWA Icons

应用 SHALL 提供符合 PWA 规范的图标文件。

- `public/pwa-192x192.png` — 192×192 像素
- `public/pwa-512x512.png` — 512×512 像素
- 图标 SHALL 使用应用品牌色（蓝色系）作为主色调

#### Scenario: 图标在安装提示中显示

- **WHEN** 浏览器弹出 PWA 安装提示
- **THEN** 安装对话框 SHALL 显示 PWA 图标
