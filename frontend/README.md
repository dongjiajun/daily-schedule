# 日程管理系统 — 前端

React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4

## 快速开始

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173，API 代理到 localhost:8080
```

## 脚本

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | TypeScript 检查 + Vite 构建 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行单元测试 |
| `npm run verify` | lint + build + test（提交前必须通过） |
| `npm run generate:api` | 从 `../specs/openapi.yaml` 生成 SDK |

## 目录结构

| 目录 | 说明 |
|------|------|
| `src/api/` | 自动生成（由 `@hey-api/openapi-ts`），**勿手动编辑** |
| `src/lib/` | 工具函数（`cn`、ICS 导出、auth 拦截器、SDK 错误处理） |
| `src/hooks/` | React Query hooks（`useEvents`、`useCategories`、`useTags` 等） |
| `src/store/` | Zustand stores（`authStore`、`calendarStore`、`settingsStore`） |
| `src/pages/` | 页面组件（`HomePage`、`LoginPage`） |
| `src/components/ui/` | shadcn/ui 基础组件（Button、Input、Dialog 等） |
| `src/components/layout/` | 布局组件（AppShell、Sidebar 等） |
| `src/components/event/` | 日程组件（EventModal、EventForm） |
| `src/components/calendar/` | 日历组件（CalendarView） |
| `src/styles/` | 主题 CSS（5 套配色方案） |

## 关键约定

- **路径别名**: `@/` → `src/`
- `src/api/` 由 `npm run generate:api` 完全管理，每次生成清空重写
- 自定义逻辑（token 注入、错误处理）放在 `src/lib/`，在 `main.tsx` 启动时注册
- import 统一使用 `@/` 别名，不使用相对路径
