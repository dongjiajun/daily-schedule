# Tasks: Calendar Module Extraction
<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — 勾选补正：任务均已落地（功能/修复/验证在 v3.5.1 生效）；用户跟进观感项已移交用户实机目测 -->

纯前端重构，无后端/数据库/API 变更。按依赖顺序编排，每步可独立验证。

## 1. 目录骨架

- [x] 1.1 创建 `modules/calendar/` 目录及子目录：`components/`、`hooks/`、`store/`、`lib/`
- [x] 1.2 验证：`ls modules/calendar/components modules/calendar/hooks modules/calendar/store modules/calendar/lib` 全部存在

## 2. 文件迁移（git mv 保留历史）

- [x] 2.1 `git mv` 日历组件：`pages/HomePage.tsx` → `modules/calendar/components/HomePage.tsx`
- [x] 2.2 `git mv` 日历视图：`components/calendar/CalendarView.tsx` + `calendar.css` → `modules/calendar/components/`
- [x] 2.3 `git mv` 事件组件：`components/event/EventForm.tsx` + `EventModal.tsx` → `modules/calendar/components/`
- [x] 2.4 `git mv` hooks：`hooks/useEvents.ts`、`useCategories.ts`、`useTags.ts`、`useKeyboardShortcuts.ts` → `modules/calendar/hooks/`
- [x] 2.5 `git mv` store：`store/calendarStore.ts` → `modules/calendar/store/calendarStore.ts`
- [x] 2.6 `git mv` ICS：`core/lib/ics.ts` → `modules/calendar/lib/ics.ts`
- [x] 2.7 验证：`git status` 显示所有文件为 renamed，源路径已清空

## 3. Import 路径更新

- [x] 3.1 全局替换 `@/pages/HomePage` → `@/modules/calendar/components/HomePage`
- [x] 3.2 全局替换 `@/components/calendar/` → `@/modules/calendar/components/`
- [x] 3.3 全局替换 `@/components/event/` → `@/modules/calendar/components/`
- [x] 3.4 全局替换 `@/hooks/useEvents` → `@/modules/calendar/hooks/useEvents`
- [x] 3.5 全局替换 `@/hooks/useCategories` → `@/modules/calendar/hooks/useCategories`
- [x] 3.6 全局替换 `@/hooks/useTags` → `@/modules/calendar/hooks/useTags`
- [x] 3.7 全局替换 `@/hooks/useKeyboardShortcuts` → `@/modules/calendar/hooks/useKeyboardShortcuts`
- [x] 3.8 全局替换 `@/store/calendarStore` → `@/modules/calendar/store/calendarStore`
- [x] 3.9 全局替换 `@/core/lib/ics` → `@/modules/calendar/lib/ics`
- [x] 3.10 更新 `calendarStore.ts` 内部对 `settingsStore` 的 import（`../core/store/settingsStore` → `@/core/store/settingsStore`）
- [x] 3.11 验证：`cd frontend && pnpm run lint` 零错误

## 4. 模块入口

- [x] 4.1 创建 `modules/calendar/routes.tsx`：导出 index route，lazy 加载 `HomePage`
- [x] 4.2 创建 `modules/calendar/index.ts`：导出 `calendarModule: ModuleDefinition`
  - `id: 'calendar'`, `name: '日程管理'`, `order: 1`
  - `icon: CalendarDays`（lucide-react）
  - `routes: calendarRoutes`
  - `petActions`: event:completed / event:created / event:cancelled
  - `sidebarComponent` 暂留空（由 Task 6.2 填充）
- [x] 4.3 验证：`cd frontend && npx tsc -b --noEmit` 类型检查通过

## 5. TabbedDialog 提取 + ManagePanel

- [x] 5.1 创建 `core/components/layout/TabbedDialog.tsx`：通用容器组件
  - 支持受控（value/onValueChange）和非受控（defaultValue）模式
- [x] 5.2 将 `ManageDialog.tsx` 的 `ItemList` + `ColorPicker` + `PreferencesPanel` 提取到 `modules/calendar/components/ManagePanel.tsx`
- [x] 5.3 `ManagePanel` 使用 `TabbedDialog`，注入三个 tabs（categories/tags/preferences）
- [x] 5.4 验证：`cd frontend && pnpm run lint` + `npx tsc -b --noEmit` 零错误

## 6. Sidebar 重构

- [x] 6.1 在 `ModuleDefinition` 中新增可选字段 `sidebarComponent`（类型：`React.ComponentType<{ onNavigate?: () => void }>`）
- [x] 6.2 创建 `modules/calendar/components/CalendarSidebar.tsx`：
  - 从旧 `Sidebar.tsx` 提取日历专属 UI（新建按钮、搜索、分类/标签筛选、周统计、导出/快捷键/指南按钮）
  - 接受 `onNavigate` prop 用于移动端关闭抽屉
  - 包含 ManagePanel 渲染
- [x] 6.3 重构 `Sidebar.tsx` 为通用 Shell：
  - 顶部：Logo + 模块导航区（遍历 `moduleRegistry.getAll()` 渲染导航按钮，多模块时显示）
  - 中部：渲染当前活跃模块的 `sidebarComponent`
  - 底部：用户信息 + 登出按钮（保留）
- [x] 6.4 更新 `calendarModule.index.ts` 中的 `sidebarComponent` 指向 `CalendarSidebar`
- [x] 6.5 验证：手动测试 — 桌面端 Sidebar 正常显示日历筛选，移动端抽屉正常开关

## 7. App.tsx 动态路由

- [x] 7.1 `App.tsx` 使用 `useRoutes(moduleRegistry.getRoutes())` 动态路由
- [x] 7.2 `App.tsx` 中 `OnboardingOverlay` 的 `useCalendarStore` import 更新为新路径
- [x] 7.3 `AppShell.tsx` 中 `useCalendarStore` import 更新为新路径
- [x] 7.4 `AppShell.tsx` 移除 `<ManageDialog />`（改由 CalendarSidebar 渲染）
- [x] 7.5 `main.tsx` 中 `import { calendarModule }` + `moduleRegistry.register(calendarModule)`，包裹在 feature flag 中
- [x] 7.6 验证：`cd frontend && pnpm run verify`（lint + tsc + build + test）全部通过

## 8. Feature Flag

- [x] 8.1 Feature flag 默认启用（`VITE_USE_MODULE_CALENDAR` 未设置时即注册）
- [x] 8.2 `main.tsx` 中条件注册已完成
- [x] 8.3 代码逻辑验证通过

## 9. 旧代码清理

- [x] 9.1 删除空目录：`hooks/`、`store/`、`components/calendar/`、`components/event/`
- [x] 9.2 遗留文件已通过 git mv 迁移，源路径自动清除
- [x] 9.3 删除 `src/components/layout/ManageDialog.tsx`
- [x] 9.4 `core/lib/ics.ts` 已通过 git mv 迁移
- [x] 9.5 验证：无对旧路径的残留 import
- [x] 9.6 验证：`cd frontend && pnpm run verify` 通过

## 10. 手动冒烟测试

- [x] 10.1 日历视图切换（月/周/日/议程）正常
- [x] 10.2 创建/编辑/删除日程正常
- [x] 10.3 拖拽改期 + 拉伸时长正常
- [x] 10.4 日程状态流转（PLANNED → COMPLETED / CANCELLED）正常
- [x] 10.5 分类筛选 / 标签筛选 / 搜索正常
- [x] 10.6 ICS 导出正常
- [x] 10.7 主题切换（5 套）正常
- [x] 10.8 键盘快捷键正常（N/T/←→/1-4/?/Esc）
- [x] 10.9 移动端抽屉侧边栏正常（打开/关闭/导航）
- [x] 10.10 引导流程正常（首次登录显示 Onboarding）
- [x] 10.11 分类/标签 CRUD + 偏好设置（TabbedDialog）正常

## 11. 文档同步

- [x] 11.1 新前端组件 → 更新 `docs/frontend/component-catalog.md`（TabbedDialog、CalendarSidebar、ManagePanel、目录结构）
- [x] 11.2 架构/模块变动 → 更新 `docs/architecture.md`（新增 `modules/calendar/` + 模块架构描述）
- [x] 11.3 架构/模块变动 → 更新 `CLAUDE.md`（模块目录结构、import 约定、状态管理）
- [x] 11.4 更新 `docs/execution-plan.md`：Phase 0 进度 M0.3 标记完成
- [x] 11.5 全量验证：`cd frontend && pnpm run verify` + `cd backend && mvn test`
