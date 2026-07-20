# Design: Calendar Module Extraction

## Context

当前状态：
- `core/` 基础设施已就绪（EventBus、ModuleRegistry、authStore、settingsStore、基础 UI 组件）
- 日历代码仍散落在 `src/` 顶层：`pages/HomePage.tsx`、`components/calendar/`、`components/event/`、`hooks/use{E vents,Categories,Tags,KeyboardShortcuts}`、`store/calendarStore.ts`
- `App.tsx` 硬编码 `<HomePage />` 路由
- `Sidebar.tsx` 硬编码日历分类/标签筛选 UI
- `ManageDialog.tsx` 硬编码分类/标签/偏好三个 Tab
- `AppShell.tsx` 从 `@/store/calendarStore` 读取 `sidebarOpen`
- `ShortcutsDialog.tsx` 从 `@/store/calendarStore` 读取 `showShortcuts`

目标：
- 所有日历专属代码迁入 `modules/calendar/`
- `App.tsx` 通过 `moduleRegistry.getRoutes()` 动态组装路由
- `Sidebar` 渲染模块导航项 + 模块专属侧边栏内容
- 通用 `TabbedDialog` 容器可被任意模块复用
- 日历功能零退化

**关键约束**：
- `src/api/` 不动（自动生成）
- `core/` 中的共享基础设施不动（authStore、settingsStore、ui 组件、eventBus、moduleRegistry）
- `lib/colors.ts` 不动（已是 re-export 兼容层）
- 后端零改动

## Goals / Non-Goals

**Goals:**
- 将日历代码迁移到 `modules/calendar/`，建立模块目录规范
- 日历模块实现 `ModuleDefinition` 接口，通过 `moduleRegistry.register()` 注册
- `App.tsx` 改为动态路由，不再硬编码日历页面
- `Sidebar.tsx` 改为模块驱动导航，支持多模块切换
- 提取通用 `TabbedDialog` 容器到 `core/components/layout/`
- `ics.ts` 从 `core/lib/` 迁回 calendar 模块（ICS 导出是日历功能，非基础设施）
- 现有测试全部通过，日历功能零退化

**Non-Goals:**
- 不添加新模块（pet、todo 等）
- 不修改业务逻辑
- 不修改后端
- 不动 `specs/openapi.yaml`
- 不引入新的外部依赖

## Decisions

### Decision 1: 日历模块目录结构

- **选择**: 采用与 `core/` 镜像的扁平结构
  ```
  modules/calendar/
  ├── index.ts              # 导出 ModuleDefinition + 自注册
  ├── routes.tsx             # 路由定义 (lazy)
  ├── components/
  │   ├── HomePage.tsx       # ← pages/HomePage.tsx
  │   ├── CalendarView.tsx   # ← components/calendar/CalendarView.tsx
  │   ├── calendar.css       # ← components/calendar/calendar.css
  │   ├── EventForm.tsx      # ← components/event/EventForm.tsx
  │   ├── EventModal.tsx     # ← components/event/EventModal.tsx
  │   └── ManagePanel.tsx    # NEW: 分类/标签/偏好管理面板
  ├── hooks/
  │   ├── useEvents.ts
  │   ├── useCategories.ts
  │   ├── useTags.ts
  │   └── useKeyboardShortcuts.ts
  ├── store/
  │   └── calendarStore.ts
  └── lib/
      └── ics.ts
  ```
- **理由**:
  - 与 `core/` 镜像结构降低认知负担
  - `index.ts` 是单一入口点，清晰表达模块边界
  - 每个模块独立管理自己的 components/hooks/store/lib
- **备选方案**:
  - 深层嵌套（`modules/calendar/views/`、`modules/calendar/models/`）：过于复杂，当前模块规模不需要
  - 全部平铺在 `modules/calendar/` 下：文件数多时难以导航

### Decision 2: 动态路由方案

- **选择**: `App.tsx` 调用 `moduleRegistry.getRoutes()` 直接展开为 `<Route>` 子元素
  ```tsx
  // App.tsx
  <Route path="/*" element={<AuthGuard><AppShell /></AuthGuard>}>
    {moduleRegistry.getRoutes()}
  </Route>
  ```
  日历模块注册 index route：
  ```tsx
  // modules/calendar/routes.tsx
  export const calendarRoutes: RouteObject[] = [
    { index: true, lazy: () => import('./components/HomePage') },
  ]
  ```
- **理由**:
  - React Router 7 的 `lazy()` 支持按模块代码分割
  - `moduleRegistry.getRoutes()` 返回扁平 `RouteObject[]`，直接可用
  - 无额外的路由抽象层
  - 未来多模块时，每个模块注册自己的 path（如 `/tasks`、`/habits`），index route 仍是日历
- **备选方案**:
  - `createBrowserRouter` + `createRoutesFromElements`：增加复杂度，当前不需要
  - 动态 `import.meta.glob` 自动扫描：不透明，模块注册中心已经是显式方案

### Decision 3: 模块驱动侧边栏

- **选择**: Sidebar 分为两层 — **通用 Shell** + **模块内容区**

  **通用 Shell**（`components/layout/Sidebar.tsx`）：
  - 顶部：模块切换导航（遍历 `moduleRegistry.getAll()` 渲染图标按钮）
  - 模块内容区：渲染当前活跃模块的侧边栏内容
  - 底部：用户信息 + 登出按钮

  **日历模块侧边栏**（`modules/calendar/components/CalendarSidebar.tsx`）：
  - 新建按钮、搜索框、分类/标签筛选、周统计、导出/快捷键/指南按钮
  - 从 `modules/calendar/store/calendarStore` 读取状态

  **实现机制**：在 `ModuleDefinition` 中新增可选字段：
  ```typescript
  sidebarComponent?: React.ComponentType<{ onNavigate?: () => void }>
  ```
  Sidebar 根据当前路由匹配的模块 ID，渲染对应模块的 `sidebarComponent`。

- **理由**:
  - Sidebar Shell 是稳定基础设施，模块内容是可变部分
  - 日历侧边栏逻辑完全封装在 calendar 模块内
  - 未来新增 pet/todo 模块时，只需在 ModuleDefinition 中提供 `sidebarComponent`
- **备选方案**:
  - 完全通用于 Sidebar + 模块注册 action 按钮：过渡抽象，当前只有日历一个模块时不需要。各模块侧边栏差异大（日历有筛选器，宠物有互动面板），统一抽象为时过早。
  - 保持 Sidebar 纯日历专属：不满足"模块驱动"目标，无法扩展多模块

### Decision 4: TabbedDialog 提取

- **选择**: 提取通用 `TabbedDialog` 容器到 `core/components/layout/TabbedDialog.tsx`
  ```typescript
  interface TabbedDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    tabs: Array<{
      id: string
      label: string
      content: React.ReactNode
    }>
    defaultTab?: string
  }
  ```
  日历模块在 `ManagePanel.tsx` 中使用 `TabbedDialog`，将分类/标签/偏好作为 tabs 注入。

- **理由**:
  - 对话框 + Tab 切换是通用 UI 模式，未来所有模块的管理面板都可复用
  - 日历管理逻辑（分类 CRUD、标签 CRUD、偏好设置）封装在 calendar 模块内
  - 偏好设置 Tab 仍使用 `settingsStore`（core 中的跨模块 store）
- **备选方案**:
  - 不提取，保持 ManageDialog 原样：代码重复不可避免，违背 Phase 0 目标
  - 提取但放在 calendar 模块内：其他模块无法复用

### Decision 5: ICS 迁回日历模块

- **选择**: `core/lib/ics.ts` → `modules/calendar/lib/ics.ts`
- **理由**:
  - ICS 导出是日历专属功能，不是跨模块基础设施
  - `core-directory-restructure` 时暂放 core 是为了最小化变更范围，本次纠正
  - 未来如笔记/任务模块需要 ICS 导出，可提升到 shared 包或 core
- **备选方案**:
  - 留在 core：core 应保持精简，ICS 导出逻辑不属于基础设施
  - 提升到 shared 包：当前无跨平台 ICS 需求（小程序不支持文件下载），过度设计

### Decision 6: Store 归属 — calendarStore 留在模块内

- **选择**: `calendarStore` 迁移到 `modules/calendar/store/calendarStore.ts`，`AppShell` 和 `App.tsx` 可从模块路径导入
- **理由**:
  - calendarStore 中除 `sidebarOpen`/`showShortcuts`/`showOnboarding` 外全是日历专属状态
  - `AppShell` 和 `App` 不是"另一个模块"，是应用外壳，可以引用模块 store
  - 拆分 store 会增加不必要的复杂度
- **备选方案**:
  - 将 `sidebarOpen`/`showShortcuts` 提取到 `core/store/navigationStore.ts`：对当前规模过度设计。日历是唯一模块时，navigation state ≈ calendar shell state
  - 通过事件总线传递 sidebar 状态：过于间接，sidebar 开关不是业务事件

### Decision 7: Feature Flag — 安全回退

- **选择**: 环境变量 `VITE_USE_MODULE_CALENDAR=true` 控制是否注册日历模块
  ```typescript
  // main.tsx
  if (import.meta.env.VITE_USE_MODULE_CALENDAR !== 'false') {
    moduleRegistry.register(calendarModule)
  }
  ```
  默认启用；设为 `false` 回退到旧硬编码行为（旧代码保留在 `legacy/` 目录一周后清理）。
- **理由**:
  - 执行计划明确要求的回退机制
  - 出问题时一个环境变量即可回退，无需重新构建
  - 旧代码在 `legacy/` 目录的保留期为一周，避免代码库膨胀
- **备选方案**:
  - 无 feature flag：风险高，上线后出问题只能紧急修复
  - runtime toggle（UI 开关）：过度设计，仅开发和回退时需要

## Architecture

### 模块注册流程

```
main.tsx
  │
  ├─→ import { calendarModule } from '@/modules/calendar'
  │
  ├─→ moduleRegistry.register(calendarModule)
  │     ├── 存储 ModuleDefinition
  │     ├── 调用 calendarModule.onInit()
  │     └── 返回 unregister 函数
  │
  └─→ ReactDOM.createRoot(<App />)
        │
        └─→ App.tsx
              └─→ <Routes>
                    └─→ {moduleRegistry.getRoutes()}
                          └─→ lazy(() => import('./modules/calendar/components/HomePage'))
```

### 组件树变更

**Before:**
```
App
├── AuthGuard
│   └── AppShell
│       ├── Sidebar (硬编码日历 UI)
│       ├── <Outlet>
│       │   └── HomePage (硬编码路由)
│       ├── ManageDialog (硬编码日历 Tab)
│       └── ShortcutsDialog (硬编码快捷键)
├── OnboardingOverlay (使用 calendarStore)
└── Toaster
```

**After:**
```
App
├── AuthGuard
│   └── AppShell
│       ├── Sidebar
│       │   ├── ModuleNav (从 registry 动态渲染)
│       │   └── ActiveModuleSidebar (calendarModule.sidebarComponent)
│       ├── <Outlet>
│       │   └── (moduleRegistry.getRoutes() 动态路由)
│       ├── TabbedDialog → ManagePanel (calendar 模块注入)
│       └── ShortcutsDialog (使用 calendarStore, import from module)
├── OnboardingOverlay (使用 calendarStore, import from module)
└── Toaster
```

### Import 路径变更矩阵

| 旧路径 | 新路径 |
|--------|--------|
| `@/pages/HomePage` | `@/modules/calendar/components/HomePage` |
| `@/components/calendar/CalendarView` | `@/modules/calendar/components/CalendarView` |
| `@/components/event/EventForm` | `@/modules/calendar/components/EventForm` |
| `@/components/event/EventModal` | `@/modules/calendar/components/EventModal` |
| `@/hooks/useEvents` | `@/modules/calendar/hooks/useEvents` |
| `@/hooks/useCategories` | `@/modules/calendar/hooks/useCategories` |
| `@/hooks/useTags` | `@/modules/calendar/hooks/useTags` |
| `@/hooks/useKeyboardShortcuts` | `@/modules/calendar/hooks/useKeyboardShortcuts` |
| `@/store/calendarStore` | `@/modules/calendar/store/calendarStore` |
| `@/core/lib/ics` | `@/modules/calendar/lib/ics` |

## DDD Layer Design

不涉及后端，纯前端重构。

## API Design

不变。

## Database Design

不变。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 日历功能回归 | `pnpm run verify` + 手动冒烟测试（创建/编辑/删除/拖拽/状态/筛选/搜索/SSE/ICS/主题/登录） |
| import 路径遗漏导致编译失败 | `tsc -b` 严格模式捕获所有类型错误，`eslint` 捕获未使用 import |
| 循环依赖（calendar ↔ core） | 单向依赖：calendar → core。core 不引用 calendar。CI 中加入 `madge` 或手动检查 |
| 移动端抽屉引用 `sidebarOpen` 需要从模块路径 import | `AppShell.tsx` import 路径从 `@/store/calendarStore` 更新为 `@/modules/calendar/store/calendarStore`，编译时校验 |
| ModuleDefinition.sidebarComponent 新增字段破坏已有模块 | 新字段定义为可选 (`?:`)，不破坏现有模块定义 |

## Migration Plan

按顺序执行，每步可独立验证：

1. **创建目录骨架** — `modules/calendar/` 下创建 `components/`、`hooks/`、`store/`、`lib/`
2. **迁移文件** — `git mv` 逐批移动，保留 git 历史
3. **更新 import 路径** — 全局搜索替换旧路径 → 新路径
4. **创建模块入口** — `index.ts`（ModuleDefinition）+ `routes.tsx`
5. **提取 TabbedDialog** — 新建 `core/components/layout/TabbedDialog.tsx`，重构 `ManageDialog` → `ManagePanel`
6. **重构 Sidebar** — 模块导航项 + 日历侧边栏提取为 `CalendarSidebar`
7. **重构 App.tsx** — 动态路由 + 模块注册
8. **添加 Feature Flag** — `VITE_USE_MODULE_CALENDAR` 环境变量
9. **验证** — `pnpm run verify` + 手动冒烟
10. **清理旧文件** — 删除 `src/pages/HomePage.tsx`、`src/components/calendar/`、`src/components/event/`、`src/hooks/use{E vents,Categories,Tags,KeyboardShortcuts}.ts`、`src/store/calendarStore.ts`、`core/lib/ics.ts`

**回滚策略**: 设置 `VITE_USE_MODULE_CALENDAR=false` 即可回退到旧硬编码行为。旧代码在 `legacy/` 目录保留一周后删除。

## Open Questions

1. **`useCategories`/`useTags` 是否应留在 core？** — 当前仅日历使用，迁入 calendar 模块。未来如任务模块需要标签，可提升到 core。先不做预测性抽象。
2. **`OnboardingOverlay` 归属？** — 引导流程当前是日历专属（引导用户创建日程），随 HomePage 迁入 calendar 模块。若未来有全局引导，可再提升。
3. **`ShortcutsDialog` 归属？** — 快捷键当前主要是日历快捷键，迁入 calendar 模块。未来多模块时，各模块注册自己的快捷键到全局 shortcuts registry。
