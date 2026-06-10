# 前端组件清单

## 组件树

```
App
├── QueryClientProvider (React Query)
│   └── BrowserRouter
│       └── Routes
│           └── /* → AuthGuard（未认证内联渲染 LoginPage）
│               ├── AppShell
│               │   ├── Sidebar（桌面常驻 / 移动端抽屉）
│               │   │   ├── 应用标题 (CalendarDays)
│               │   │   ├── 新建日程按钮（N）
│               │   │   ├── 搜索框（/ 聚焦）
│               │   │   ├── 分类筛选列表（再点取消筛选）
│               │   │   ├── 标签筛选 chips
│               │   │   ├── WeekStats（今日/本周/完成率）
│               │   │   └── 设置 / 导出 ICS / 快捷键 / 指南 / 退出
│               │   ├── ManageDialog（分类 · 标签 · 偏好设置三页签）
│               │   ├── ShortcutsDialog（键盘快捷键帮助）
│               │   └── HomePage
│               │       ├── CalendarView (react-big-calendar + DnD addon)
│               │       │   ├── 自定义 Toolbar + 中文 locale（周一起始）
│               │       │   ├── 拖拽改期 / 拉伸调时长
│               │       │   └── 事件悬停一键标记完成
│               │       ├── EventModal (条件渲染)
│               │       │   ├── 标记完成 / 恢复计划 + 删除确认
│               │       │   └── EventForm
│               │       │       ├── 标题 / 全天开关
│               │       │       ├── 开始/结束时间（智能默认值）
│               │       │       ├── 描述 / 分类 / 颜色
│               │       │       └── 地点 / 提醒（偏好默认） / 标签选择
│               │       └── OnboardingGuide (引导教程)
│               └── ErrorBoundary（错误边界）
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 主日历页面（AuthGuard 保护，未认证内联渲染 LoginPage） |

## 状态管理

| 工具 | 用途 | 存储内容 |
|------|------|----------|
| Zustand (`authStore`) | 认证状态 | accessToken、refreshToken、expiresAt、user；localStorage `auth.v3`；logout 调用 `/auth/logout` |
| Zustand (`calendarStore`) | UI 状态 | 当前日期、视图、弹窗状态、分类/标签筛选、搜索词、管理弹窗、快捷键帮助、移动端侧栏 |
| Zustand (`settingsStore`) | 用户偏好（persist） | 默认视图、默认提醒、快速新建时长、是否显示已完成；localStorage `settings.v1` |
| React Query | 服务端数据 | 事件列表(按范围+筛选缓存)、分类列表、标签列表 |

## 组件清单

### 日历模块
- **CalendarView** (`components/calendar/CalendarView.tsx`) — react-big-calendar + `withDragAndDrop`，支持月/周/日/议程视图、拖拽改期/拉伸时长、已完成置灰删除线、悬停一键完成
- **calendar.css** — 日历组件样式覆盖（Tailwind 设计系统）

### 事件模块
- **EventModal** (`components/event/EventModal.tsx`) — 创建/编辑弹窗，含标记完成/恢复计划、删除确认、已完成徽标
- **EventForm** (`components/event/EventForm.tsx`) — 事件表单；新建时智能默认（下一个整/半点 + 偏好时长 + 偏好提醒）

### 认证模块
- **LoginPage** (`pages/LoginPage.tsx`) — 登录/注册表单，渐变背景 + Framer Motion 入场动画
- **AuthGuard** (`App.tsx`) — 路由守卫，未认证时内联渲染 LoginPage
- **authInterceptor** (`api/authInterceptor.ts`) — Bearer 注入 + access token 过期前 30s 单飞自动续签 + 401 强制登出

### 布局模块
- **AppShell** (`components/layout/AppShell.tsx`) — 侧边栏 + 内容区；`md` 以下侧栏变为抽屉（浮动按钮唤起）
- **Sidebar** (`components/layout/Sidebar.tsx`) — 新建、搜索、分类/标签筛选、周统计、设置/导出/快捷键/指南/退出
- **ManageDialog** (`components/layout/ManageDialog.tsx`) — 分类与标签的增删改（含色板）+ 偏好设置
- **ShortcutsDialog** (`components/layout/ShortcutsDialog.tsx`) — 快捷键速查（? 唤起）
- **ErrorBoundary** (`components/layout/ErrorBoundary.tsx`) — React 错误边界，fallback UI + 重载按钮
- **OnboardingGuide** (`components/layout/OnboardingGuide.tsx`) — 3 步引导教程，可通过侧边栏重新打开

### UI 基础（shadcn/ui）
- **Button** (`components/ui/button.tsx`) — variant（default/destructive/outline/secondary/ghost/link）+ size（default/sm/lg/icon）
- **Input** (`components/ui/input.tsx`) — 标准文本输入
- **Textarea** (`components/ui/textarea.tsx`) — 多行文本输入
- **Label** (`components/ui/label.tsx`) — 基于 Radix Label，可关联表单控件
- **Dialog** (`components/ui/dialog.tsx`) — Radix Dialog 封装；Header/Title/Description/Footer 子组件
- **Switch** (`components/ui/switch.tsx`) — Radix Switch，单一布尔切换
- **Select** (`components/ui/select.tsx`) — Radix Select，可选项下拉
- **Popover** (`components/ui/popover.tsx`) — Radix Popover，浮层容器
- **Tabs** (`components/ui/tabs.tsx`) — Radix Tabs，多标签切换（ManageDialog 使用）

## 自定义 Hooks

| Hook | 文件 | 说明 |
|------|------|------|
| useEvents | hooks/useEvents.ts | 事件查询（分类/标签/关键词过滤）+ CRUD + useToggleEventStatus 一键完成 |
| useCategories | hooks/useCategories.ts | 分类 CRUD（React Query） |
| useTags | hooks/useTags.ts | 标签 CRUD（React Query） |
| useKeyboardShortcuts | hooks/useKeyboardShortcuts.ts | 全局快捷键：N/T/←→/1-4//?/Esc |
| useNotification | hooks/useNotification.ts | 浏览器 Notification API |
| useSseNotifications | hooks/useSseNotifications.ts | SSE 实时通知订阅 |

## 工具库

| 文件 | 说明 |
|------|------|
| lib/ics.ts | iCalendar (.ics) 导出：当前视图日程一键导出，可导入系统日历 |
| api/unwrap.ts | hey-api 响应错误统一抛出（带后端 message），修复"失败也弹成功"的问题 |

## 自动生成代码

| 文件 | 来源 | 说明 |
|------|------|------|
| api/sdk.gen.ts | specs/openapi.yaml | 类型安全 API 客户端（含 `subscribeNotifications` SSE 方法） |
| api/types.gen.ts | specs/openapi.yaml | 请求/响应 TypeScript 类型，含 `EventStatus`、`ReminderEvent` |
| api/client.gen.ts | @hey-api/openapi-ts | fetch 客户端实例（baseUrl `/api/v1`） |
| api/core/ | @hey-api/openapi-ts | 序列化/SSE 等运行时支撑代码 |

执行 `npm run generate:api`（在 `frontend/` 下）从 `../specs/openapi.yaml` 重新生成。配置见 `frontend/openapi-ts.config.ts`。
注意：`api/authInterceptor.ts` 与 `api/unwrap.ts` 为手工维护文件，重新生成后如被清除需从 git 恢复。
