# 前端组件清单

## 组件树

```
ErrorBoundary（最外层错误捕获）
└── QueryClientProvider (React Query)
    └── BrowserRouter
        └── useRoutes (动态路由，从 moduleRegistry.getRoutes() 装配)
            └── /* → AuthGuard（未认证内联渲染 LoginPage）
                └── AppShell
                    ├── Sidebar（通用 Shell）
                    │   ├── Logo + 应用标题
                    │   ├── ModuleNav（从 moduleRegistry.getAll() 动态渲染）
                    │   ├── ActiveModuleSidebar（当前活跃模块的 sidebarComponent）
                    │   └── 用户信息 + 登出
                    ├── ShortcutsDialog（键盘快捷键帮助）
                    └── <Outlet> → CalendarSidebar（日历模块专属侧边栏）
                        ├── 新建日程按钮（N）
                        ├── 搜索框（/ 聚焦）
                        ├── 分类筛选列表（再点取消筛选）
                        ├── 标签筛选 chips
                        ├── WeekStats（今日/本周/完成率）
                        ├── 设置 / 导出 ICS / 快捷键 / 指南
                        └── ManagePanel（分类 · 标签 · 偏好设置 · 主题配色）
    └── OnboardingOverlay → OnboardingGuide（引导教程，App 层）
    └── Toaster（sonner Toast 通知）
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage (calendar 模块) | 主日历页面（AuthGuard 保护，未认证内联渲染 LoginPage） |
| 未来 | pet/todo/habits 等 | 各模块通过 `moduleRegistry.register()` 声明路由 |

## 目录结构

```
frontend/src/
├── core/                    # 稳定基础设施
│   ├── components/
│   │   ├── ui/              # shadcn/ui 基础组件（9 个）
│   │   └── layout/          # 通用布局组件
│   │       └── TabbedDialog.tsx   # 通用标签对话框容器
│   ├── hooks/               # 跨模块共享 hooks
│   │   ├── useTheme.ts
│   │   ├── useNotification.ts
│   │   └── useSseNotifications.ts
│   ├── lib/                 # 核心工具库
│   │   ├── authInterceptor.ts
│   │   ├── eventBus.ts      # EventBus 单例
│   │   ├── moduleRegistry.ts
│   │   ├── unwrap.ts
│   │   └── utils.ts
│   ├── store/               # 跨模块 Zustand stores
│   │   ├── authStore.ts
│   │   └── settingsStore.ts
│   └── styles/
│       └── themes.css       # 5 套主题定义
│
├── modules/                 # 可插拔功能模块
│   └── calendar/
│       ├── index.ts         # ModuleDefinition 导出
│       ├── routes.tsx        # lazy 路由定义
│       ├── components/
│       │   ├── HomePage.tsx
│       │   ├── CalendarView.tsx
│       │   ├── calendar.css
│       │   ├── EventForm.tsx
│       │   ├── EventModal.tsx
│       │   ├── CalendarSidebar.tsx   # 日历专属侧边栏
│       │   └── ManagePanel.tsx        # 管理面板（分类/标签/偏好）
│       ├── hooks/
│       │   ├── useEvents.ts
│       │   ├── useCategories.ts
│       │   ├── useTags.ts
│       │   └── useKeyboardShortcuts.ts
│       ├── store/
│       │   └── calendarStore.ts
│       └── lib/
│           └── ics.ts
│
├── components/layout/        # 应用 Shell 布局组件
│   ├── AppShell.tsx
│   ├── Sidebar.tsx           # 通用 Sidebar Shell
│   ├── ShortcutsDialog.tsx
│   ├── ErrorBoundary.tsx
│   └── OnboardingGuide.tsx
│
├── pages/
│   └── LoginPage.tsx
├── api/                      # 自动生成（hey-api）
└── lib/
    └── colors.ts             # 颜色常量 re-export（兼容层）
```

## 状态管理

| 工具 | 用途 | 存储内容 |
|------|------|----------|
| Zustand (`authStore`) | 认证状态 | accessToken、refreshToken、expiresAt、user；localStorage `auth.v3`；logout 调用 `/auth/logout` |
| Zustand (`calendarStore`) | 日历 UI 状态 | 当前日期、视图、弹窗状态、分类/标签筛选、搜索词、管理弹窗、快捷键帮助、移动端侧栏 |
| Zustand (`settingsStore`) | 用户偏好（persist） | 默认视图、默认提醒、快速新建时长、是否显示已完成、主题预设（5 套）+ 主题标签/颜色映射；localStorage `settings.v1` |
| React Query | 服务端数据 | 事件列表(按范围+筛选缓存)、分类列表、标签列表 |

## 组件清单

### 核心容器（Core Components）

- **TabbedDialog** (`core/components/layout/TabbedDialog.tsx`) — 通用标签对话框容器，支持受控/非受控模式，供各模块复用

### 日历模块 (`modules/calendar/`)

- **HomePage** — 日历主页面，组合 CalendarView + EventModal
- **CalendarView** — react-big-calendar + `withDragAndDrop`，支持月/周/日/议程视图、拖拽改期/拉伸时长、已完成置灰删除线、悬停一键完成
- **EventModal** — 创建/编辑弹窗，含标记完成/恢复计划、删除确认、已完成徽标
- **EventForm** — 事件表单；新建时智能默认（下一个整/半点 + 偏好时长 + 偏好提醒）
- **CalendarSidebar** — 日历模块专属侧边栏：新建按钮、搜索、分类/标签筛选、周统计、操作按钮、ManagePanel
- **ManagePanel** — 管理面板，使用 TabbedDialog 提供分类/标签/偏好设置三个标签页

### 认证模块

- **LoginPage** (`pages/LoginPage.tsx`) — 登录/注册表单，渐变背景 + Framer Motion 入场动画
- **AuthGuard** (`App.tsx`) — 路由守卫，未认证时内联渲染 LoginPage
- **authInterceptor** (`core/lib/authInterceptor.ts`) — Bearer 注入 + access token 过期前 30s 单飞自动续签 + 401 强制登出

### 布局模块

- **AppShell** (`components/layout/AppShell.tsx`) — 侧边栏 + 内容区；`md` 以下侧栏变为抽屉（浮动按钮唤起）
- **Sidebar** (`components/layout/Sidebar.tsx`) — 通用 Shell：模块导航 + 活跃模块侧边栏内容 + 用户信息/登出
- **ShortcutsDialog** (`components/layout/ShortcutsDialog.tsx`) — 快捷键速查（? 唤起）
- **ErrorBoundary** (`components/layout/ErrorBoundary.tsx`) — React 错误边界，fallback UI + 重载按钮
- **OnboardingGuide** (`components/layout/OnboardingGuide.tsx`) — 3 步引导教程，可通过侧边栏重新打开

### UI 基础（shadcn/ui, `core/components/ui/`）

9 个基础组件：Button, Input, Textarea, Label, Dialog, Switch, Select, Popover, Tabs

## 自定义 Hooks

| Hook | 位置 | 说明 |
|------|------|------|
| useEvents | modules/calendar/hooks/ | 事件查询（分类/标签/关键词过滤）+ CRUD + useToggleEventStatus 一键完成 |
| useCategories | modules/calendar/hooks/ | 分类 CRUD（React Query） |
| useTags | modules/calendar/hooks/ | 标签 CRUD（React Query） |
| useKeyboardShortcuts | modules/calendar/hooks/ | 全局快捷键：N/T/←→/1-4//?/Esc |
| useNotification | core/hooks/ | 浏览器 Notification API |
| useSseNotifications | core/hooks/ | SSE 实时通知订阅 |
| useTheme | core/hooks/ | 读取 settingsStore.theme → 设置 `document.documentElement.dataset.theme` |

## 模块注册中心

- **ModuleRegistry** (`core/lib/moduleRegistry.ts`) — 管理插件式架构中所有模块的生命周期
- **EventBus** (`core/lib/eventBus.ts`) — 类型安全的同步事件总线（单例，从 `@daily-schedule/shared` 导入 EventBus 类）
- 模块间不允许直接 import store/组件，仅通过事件总线通信

## 工具库

| 文件 | 说明 |
|------|------|
| modules/calendar/lib/ics.ts | iCalendar (.ics) 导出：当前视图日程一键导出，可导入系统日历 |
| lib/colors.ts | PRESET_COLORS 共享常量（9 个色板预设值） |
| core/styles/themes.css | 主题 Token 定义：5 套预设 × 27 个 CSS 自定义属性 |
| core/lib/unwrap.ts | hey-api 响应错误统一抛出（带后端 message），修复"失败也弹成功"的问题 |

## 自动生成代码

| 文件 | 来源 | 说明 |
|------|------|------|
| api/sdk.gen.ts | specs/openapi.yaml | 类型安全 API 客户端（含 `subscribeNotifications` SSE 方法） |
| api/types.gen.ts | specs/openapi.yaml | 请求/响应 TypeScript 类型，含 `EventStatus`、`ReminderEvent` |
| api/client.gen.ts | @hey-api/openapi-ts | fetch 客户端实例（baseUrl `/api/v1`） |
| api/core/ | @hey-api/openapi-ts | 序列化/SSE 等运行时支撑代码 |

执行 `npm run generate:api`（在 `frontend/` 下）从 `../specs/openapi.yaml` 重新生成。配置见 `frontend/openapi-ts.config.ts`。
注意：`core/lib/authInterceptor.ts` 与 `core/lib/unwrap.ts` 为手工维护文件，重新生成后如被清除需从 git 恢复。
