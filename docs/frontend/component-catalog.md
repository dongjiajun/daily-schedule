# 前端组件清单

## 组件树

```
App
├── QueryClientProvider (React Query)
│   └── BrowserRouter
│       └── Routes
│           ├── /login → LoginPage
│           │   └── 登录/注册表单 + 渐变背景 + 动效
│           └── / → AuthGuard
│               ├── AppShell
│               │   ├── Sidebar
│               │   │   ├── 应用标题 (CalendarDays)
│               │   │   ├── 新建日程按钮
│               │   │   ├── 分类筛选列表 + 内联创建
│               │   │   └── 使用指南按钮 / 退出登录
│               │   └── HomePage
│               │       ├── CalendarView (react-big-calendar)
│               │       │   └── 自定义 Toolbar + 中文 locale
│               │       ├── EventModal (条件渲染)
│               │       │   └── EventForm
│               │       │       ├── 标题 / 全天开关
│               │       │       ├── 开始/结束时间选择器
│               │       │       ├── 描述 / 分类 / 颜色
│               │       │       └── 地点 / 提醒 / 标签选择
│               │       └── OnboardingGuide (引导教程)
│               └── ErrorBoundary（错误边界）
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录/注册页面 |
| `/` | HomePage | 主日历页面（需登录，AuthGuard 保护） |
| `/settings` | (待实现) | 设置页面 |

## 状态管理

| 工具 | 用途 | 存储内容 |
|------|------|----------|
| Zustand (`authStore`) | 认证状态 | token、userId、username、isAuthenticated，登录/登出 + localStorage |
| Zustand (`calendarStore`) | UI 状态 | 当前日期、视图类型、弹窗状态、编辑 ID、分类筛选、引导教程 |
| React Query | 服务端数据 | 事件列表(按范围缓存)、分类列表、标签列表 |

## 组件清单

### 日历模块
- **CalendarView** (`components/calendar/CalendarView.tsx`) — react-big-calendar 封装，支持月/周/日/列表视图
- **calendar.css** — 日历组件样式覆盖（Tailwind 设计系统）

### 事件模块
- **EventModal** (`components/event/EventModal.tsx`) — 创建/编辑弹窗，含删除确认
- **EventForm** (`components/event/EventForm.tsx`) — 事件表单，含全天、时间、分类、颜色、提醒、标签

### 认证模块
- **LoginPage** (`pages/LoginPage.tsx`) — 登录/注册表单，渐变背景 + Framer Motion 入场动画
- **AuthGuard** (`App.tsx`) — 路由守卫，未认证时重定向到 `/login`

### 布局模块
- **AppShell** (`components/layout/AppShell.tsx`) — 侧边栏 + 内容区 flex 布局
- **Sidebar** (`components/layout/Sidebar.tsx`) — 导航 + 新建按钮 + 分类筛选 + 使用指南 + 退出登录
- **ErrorBoundary** (`components/layout/ErrorBoundary.tsx`) — React 错误边界，fallback UI + 重载按钮
- **OnboardingGuide** (`components/layout/OnboardingGuide.tsx`) — 3 步引导教程（欢迎/新建日程/筛选），Framer Motion spring 动画，可通过侧边栏重新打开

### UI 基础（shadcn/ui）
- **Button** (`components/ui/button.tsx`) — variant（default/destructive/outline/secondary/ghost/link）+ size（default/sm/lg/icon）
- **Input** (`components/ui/input.tsx`) — 标准文本输入
- **Textarea** (`components/ui/textarea.tsx`) — 多行文本输入
- **Label** (`components/ui/label.tsx`) — 基于 Radix Label，可关联表单控件
- **Dialog** (`components/ui/dialog.tsx`) — Radix Dialog 封装；Header/Title/Description/Footer 子组件
- **Switch** (`components/ui/switch.tsx`) — Radix Switch，单一布尔切换
- **Select** (`components/ui/select.tsx`) — Radix Select，可选项下拉
- **Popover** (`components/ui/popover.tsx`) — Radix Popover，浮层容器
- **Tabs** (`components/ui/tabs.tsx`) — Radix Tabs，多标签切换

## 自定义 Hooks

| Hook | 文件 | 说明 |
|------|------|------|
| useEvents | hooks/useEvents.ts | 事件 CRUD（React Query） |
| useCategories | hooks/useCategories.ts | 分类 CRUD（React Query） |
| useTags | hooks/useTags.ts | 标签 CRUD（React Query） |
| useNotification | hooks/useNotification.ts | 浏览器 Notification API |
| useSseNotifications | hooks/useSseNotifications.ts | SSE 实时通知订阅 |

## 自动生成代码

| 文件 | 来源 | 说明 |
|------|------|------|
| api/sdk.gen.ts | specs/openapi.yaml | 类型安全 API 客户端（含 `subscribeNotifications` SSE 方法） |
| api/types.gen.ts | specs/openapi.yaml | 请求/响应 TypeScript 类型，含 `ReminderEvent` SSE 负载 |
| api/client.gen.ts | @hey-api/openapi-ts | fetch 客户端实例（baseUrl `/api/v1`） |
| api/core/ | @hey-api/openapi-ts | 序列化/SSE 等运行时支撑代码 |

执行 `npm run generate:api`（在 `frontend/` 下）从 `../specs/openapi.yaml` 重新生成。配置见 `frontend/openapi-ts.config.ts`。
