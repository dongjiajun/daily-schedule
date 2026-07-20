# Calendar Module

日历功能作为独立可插拔模块，实现 `ModuleDefinition` 接口，通过 `moduleRegistry.register()` 注册。

## ADDED Requirements

### Requirement: Calendar Module Directory Structure

日历模块 SHALL 遵循 `modules/calendar/` 目录结构：

```
modules/calendar/
├── index.ts              # 导出 ModuleDefinition + 自注册
├── routes.tsx             # 路由定义 (lazy loaded)
├── components/            # 日历 UI 组件
│   ├── HomePage.tsx
│   ├── CalendarView.tsx
│   ├── calendar.css
│   ├── EventForm.tsx
│   ├── EventModal.tsx
│   └── CalendarSidebar.tsx
├── hooks/                 # 日历专属 React Query hooks
│   ├── useEvents.ts
│   ├── useCategories.ts
│   ├── useTags.ts
│   └── useKeyboardShortcuts.ts
├── store/
│   └── calendarStore.ts   # 日历 UI 状态 (Zustand)
└── lib/
    └── ics.ts             # ICS 文件导出
```

#### Scenario: 模块目录完整性

- **WHEN** 日历模块迁移完成后
- **THEN** `modules/calendar/index.ts` SHALL 存在并导出 `calendarModule: ModuleDefinition`
- **THEN** `modules/calendar/routes.tsx` SHALL 存在并导出 `RouteObject[]`
- **THEN** 所有日历组件/hooks/store/lib SHALL 位于模块目录内
- **THEN** `src/pages/HomePage.tsx`、`src/components/calendar/`、`src/components/event/` SHALL 已删除

### Requirement: Calendar ModuleDefinition

日历模块 SHALL 实现 `ModuleDefinition` 接口，包含以下字段：

- `id` MUST 为 `'calendar'`
- `name` MUST 为 `'日程管理'`
- `description` MUST 为非空描述字符串
- `icon` MUST 为 `CalendarDays` (lucide-react)
- `order` MUST 为 `1`（首个模块）
- `routes` MUST 包含 index route，lazy 加载 `HomePage`
- `sidebarComponent` MUST 为 `CalendarSidebar` 组件
- `petActions` MUST 声明以下行为：
  - `{ eventType: 'event:completed', description: '完成日程 → +专注币 +经验' }`
  - `{ eventType: 'event:created', description: '创建日程 → +少量经验' }`
  - `{ eventType: 'event:cancelled', description: '取消日程 → 宠物失落' }`

#### Scenario: 日历模块注册

- **WHEN** `main.tsx` 中调用 `moduleRegistry.register(calendarModule)`
- **THEN** ModuleRegistry SHALL 存储日历模块定义
- **THEN** `moduleRegistry.get('calendar')` SHALL 返回日历模块定义
- **THEN** `moduleRegistry.getRoutes()` SHALL 包含日历的 index route

#### Scenario: 日历模块路由延迟加载

- **WHEN** 应用首次加载且用户未访问日历路由
- **THEN** 日历模块的 `HomePage` 组件 SHALL NOT 被加载到浏览器
- **WHEN** 用户导航到根路径 `/`
- **THEN** 日历模块 SHALL 通过 React Router `lazy()` 按需加载

### Requirement: Feature Flag Control

日历模块 SHALL 受环境变量 `VITE_USE_MODULE_CALENDAR` 控制：

- 默认值 SHALL 为 `true`（启用）
- 设为 `'false'` 时 SHALL 回退到旧硬编码路由
- Feature flag 检查 SHALL 在 `main.tsx` 中完成，构建时决定

#### Scenario: Feature flag 启用（默认）

- **WHEN** `VITE_USE_MODULE_CALENDAR` 未设置或为 `'true'`
- **THEN** `main.tsx` SHALL 调用 `moduleRegistry.register(calendarModule)`
- **THEN** 应用 SHALL 通过模块注册中心加载日历路由

#### Scenario: Feature flag 禁用

- **WHEN** `VITE_USE_MODULE_CALENDAR=false`
- **THEN** `main.tsx` SHALL NOT 注册日历模块
- **THEN** 应用 SHALL 使用旧的硬编码 `<HomePage />` 路由

### Requirement: ICS Export in Calendar Module

ICS 导出功能 SHALL 属于日历模块：

- `modules/calendar/lib/ics.ts` SHALL 包含 `downloadICS` 函数
- `core/lib/ics.ts` SHALL 已删除
- 所有 `downloadICS` 的 import SHALL 指向 `@/modules/calendar/lib/ics`

#### Scenario: ICS 导出引用路径正确

- **WHEN** Sidebar 中点击"导出"按钮
- **THEN** `downloadICS` SHALL 从 `@/modules/calendar/lib/ics` 导入
- **THEN** 导出功能 SHALL 与迁移前行为一致
