# 前端组件清单

## 组件树

```
App
├── QueryClientProvider (React Query)
│   └── BrowserRouter
│       └── Routes
│           └── AppShell
│               ├── Sidebar
│               │   ├── 应用标题 (CalendarDays)
│               │   ├── 新建日程按钮
│               │   └── 分类筛选列表
│               └── HomePage
│                   ├── CalendarView (react-big-calendar)
│                   │   └── 自定义 Toolbar + 中文 locale
│                   └── EventModal (条件渲染)
│                       └── EventForm
│                           ├── 标题 / 全天开关
│                           ├── 开始/结束时间选择器
│                           ├── 描述 / 分类 / 颜色
│                           └── 地点 / 提醒 / 标签选择
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 主日历页面 |
| `/settings` | (待实现) | 设置页面 |

## 状态管理

| 工具 | 用途 | 存储内容 |
|------|------|----------|
| Zustand (`calendarStore`) | UI 状态 | 当前日期、视图类型、弹窗状态、编辑 ID、分类筛选 |
| React Query | 服务端数据 | 事件列表(按范围缓存)、分类列表、标签列表 |

## 组件清单

### 日历模块
- **CalendarView** (`components/calendar/CalendarView.tsx`) — react-big-calendar 封装，支持月/周/日/列表视图
- **calendar.css** — 日历组件样式覆盖（Tailwind 设计系统）

### 事件模块
- **EventModal** (`components/event/EventModal.tsx`) — 创建/编辑弹窗，含删除确认
- **EventForm** (`components/event/EventForm.tsx`) — 事件表单，含全天、时间、分类、颜色、提醒、标签

### 布局模块
- **AppShell** (`components/layout/AppShell.tsx`) — 侧边栏 + 内容区 flex 布局
- **Sidebar** (`components/layout/Sidebar.tsx`) — 导航 + 新建按钮 + 分类筛选

### UI 基础
- **Button** (`components/ui/button.tsx`) — shadcn/ui 按钮（variant + size）

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
| api/sdk.gen.ts | specs/openapi.yaml | 类型安全 API 客户端 |
| api/types.gen.ts | specs/openapi.yaml | 请求/响应 TypeScript 类型 |
