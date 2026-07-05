# Proposal: 主题系统与可配置设置框架

## Why

当前应用全部使用硬编码的 Tailwind `gray-*` 类 + 100+ 处十六进制色值，只有一套浅色方案，视觉单调。用户需要多套配色方案来表达个人偏好，同时为后续可配置能力（通知偏好、日历密度等）搭建可扩展的设置框架。

## What Changes

- 新增 21 个语义化 CSS 自定义属性作为设计 Token，覆盖背景/文本/边框/强调/语义色
- 新增 5 套主题预设：default（当前冷灰蓝）、warm（暖琥珀）、nature（森林绿）、dark（深色）、lavender（薰衣草紫）
- 通过 `html[data-theme]` 属性切换主题，Tailwind 4 `@theme` 映射为 utility 类
- 扩展 `settingsStore` 新增 `theme` 字段 + `setTheme` action（Zustand persist 持久化）
- 偏好设置面板新增主题选择器 UI
- 所有 UI 组件、布局组件、日历组件、页面组件：`gray-*` 类 → 语义 token 类
- 修复不一致：统一 LoginPage 输入框聚焦色、统一今日高亮色值、提取重复的 PRESET_COLORS 常量

## Capabilities

### New Capabilities
- `theme-system`: 全应用多套配色主题系统，21 个语义 Token + 5 套预设，运行时切换，持久化到 localStorage
- `settings-framework`: 可扩展的设置框架，`settingsStore` 支持任意新增设置项，ManageDialog 偏好页统一入口

### Modified Capabilities
- 无（纯前端视觉层变更，不涉及已有能力的需求级变更）

## API Contract Impact

无影响。纯前端视觉层变更，不涉及 `specs/openapi.yaml` 的任何端点、Schema、认证机制。

## DDD Layer Impact

无影响。变更仅在 `frontend/` 目录内：
- 无后端 Java 代码变更
- 无数据库迁移
- 无 API 端点变更

## Database Impact

无需 Flyway 迁移。

## Impact

**受影响文件（23 个）**：
- 新建 1：`frontend/src/styles/themes.css`
- 修改 1：`frontend/src/index.css`（@theme + tokens 引入）
- 修改 1：`frontend/src/store/settingsStore.ts`（theme 字段）
- 修改 1：`frontend/src/components/layout/ManageDialog.tsx`（主题选择器）
- 迁移 9：`frontend/src/components/ui/*.tsx`（gray-* → 语义类）
- 迁移 5：`frontend/src/components/layout/*.tsx`
- 迁移 3：`frontend/src/components/event/*.tsx` + `calendar/*.tsx`
- 迁移 2：`frontend/src/pages/*.tsx`
- 配置 1：`frontend/src/components/calendar/calendar.css`

**无新依赖**，不改变 API、数据库、认证机制。
