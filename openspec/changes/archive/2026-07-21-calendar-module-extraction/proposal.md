# Proposal: Calendar Module Extraction

## Why

Phase 0 的前三个 changes 已建立基础设施（Monorepo、EventBus、ModuleRegistry、Core 目录），但日历代码仍散落在 `src/` 顶层的 `pages/`、`components/`、`hooks/`、`store/` 中。需要将日历提取为 `modules/calendar/`，验证 ModuleRegistry 驱动的插件式架构切实可行，为后续模块（pet、todo 等）建立模板。

## What Changes

- 日历组件迁移：`pages/HomePage.tsx`、`components/calendar/`、`components/event/` → `modules/calendar/components/`
- 日历 hooks 迁移：`useEvents`、`useCategories`、`useTags`、`useKeyboardShortcuts` → `modules/calendar/hooks/`
- 日历 store 迁移：`store/calendarStore.ts` → `modules/calendar/store/`
- 日历专属工具迁移：`core/lib/ics.ts`（ICS 导出为日历专属功能，不应在 core 中）→ `modules/calendar/lib/`
- 新增模块入口：`modules/calendar/index.ts`（导出 `ModuleDefinition`）+ `modules/calendar/routes.tsx`
- **重构** `App.tsx`：从硬编码 `<HomePage />` 改为 `moduleRegistry.getRoutes()` 动态路由
- **重构** `Sidebar.tsx`：从硬编码日历 UI 改为模块驱动的导航（遍历已注册模块渲染导航项）
- **重构** `ManageDialog.tsx`：提取通用 `TabbedDialog` 容器到 `core/components/`，日历管理内容保留在 calendar 模块内

## Capabilities

### New Capabilities

- `calendar-module`: 日历作为独立可插拔模块，实现 `ModuleDefinition` 接口，通过 `moduleRegistry.register()` 注册
- `dynamic-module-routing`: `App.tsx` 基于 `moduleRegistry.getRoutes()` 动态组装路由，不再硬编码模块路由
- `module-driven-navigation`: `Sidebar` 基于 `moduleRegistry.getAll()` 动态生成导航项，支持模块声明的图标、名称、排序
- `tabbed-dialog`: 通用 `TabbedDialog` 容器组件，支持以声明方式注册标签页，模块可注入自定义管理面板

### Modified Capabilities

无（纯前端重构，不修改功能行为）

## API Contract Impact

无。

## DDD Layer Impact

无。

## Database Impact

无。

## Impact

### 迁移文件（~10 个）

| 来源 | 目标 | 文件 |
|------|------|------|
| `pages/HomePage.tsx` | `modules/calendar/components/HomePage.tsx` | 1 |
| `components/calendar/` | `modules/calendar/components/` | 2 (.tsx + .css) |
| `components/event/` | `modules/calendar/components/` | 2 |
| `hooks/useEvents.ts` | `modules/calendar/hooks/` | 1 |
| `hooks/useCategories.ts` | `modules/calendar/hooks/` | 1 |
| `hooks/useTags.ts` | `modules/calendar/hooks/` | 1 |
| `hooks/useKeyboardShortcuts.ts` | `modules/calendar/hooks/` | 1 |
| `store/calendarStore.ts` | `modules/calendar/store/` | 1 |
| `core/lib/ics.ts` | `modules/calendar/lib/` | 1 |

### 重构文件

| 文件 | 变更 |
|------|------|
| `App.tsx` | 移除硬编码 `<HomePage />` + `useCalendarStore`（OnboardingOverlay 移至 calendar 模块或 AppShell），改用 `moduleRegistry.getRoutes()` 动态路由 |
| `components/layout/Sidebar.tsx` | 移除硬编码的日历导航（分类/标签筛选、新建按钮、搜索、导出），改为遍历 `moduleRegistry.getAll()` 渲染模块导航项 |
| `components/layout/ManageDialog.tsx` | 提取 `TabbedDialog` 通用容器到 `core/components/layout/`，日历分类/标签/偏好管理移至 `modules/calendar/components/` |

### 新增文件

| 路径 | 说明 |
|------|------|
| `modules/calendar/index.ts` | 日历模块入口，导出 `ModuleDefinition` |
| `modules/calendar/routes.tsx` | 日历模块路由定义（lazy loaded） |
| `modules/calendar/lib/ics.ts` | ICS 导出（从 core 迁回） |
| `core/components/layout/TabbedDialog.tsx` | 通用 TabbedDialog 容器 |

### 删除文件

| 路径 | 说明 |
|------|------|
| `pages/HomePage.tsx` | 迁移至 `modules/calendar/components/` |
| `components/calendar/` | 迁移至 `modules/calendar/components/` |
| `components/event/` | 迁移至 `modules/calendar/components/` |
| `core/lib/ics.ts` | 迁移至 `modules/calendar/lib/` |

### 受影响但不动

| 路径 | 原因 |
|------|------|
| `src/api/` | 自动生成，不动 |
| `core/components/ui/` | 基础 UI 组件，不动 |
| `core/store/authStore.ts` | 认证 store，不动 |
| `core/store/settingsStore.ts` | 偏好 store，不动 |
| `core/lib/eventBus.ts` | 事件总线，不动 |
| `core/lib/moduleRegistry.ts` | 模块注册中心，不动 |
