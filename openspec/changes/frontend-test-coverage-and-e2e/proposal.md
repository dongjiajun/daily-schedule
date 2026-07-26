# Proposal: 前端测试覆盖补全 + Playwright E2E 引入

## Why

前端 83 个源文件仅 19 个有测试（23% 覆盖率），E2E 测试为零。最近 OnboardingGuide 的"下一步无响应"bug 逃过了所有自动化检查直接到达浏览器——这正是缺少组件测试和 E2E 冒烟测试的直接后果。补齐测试基础设施是保障后续 Phase 2 开发质量的必要条件。

## What Changes

### 单元测试补全（P0 → P1）

**P0 — 关键路径必补（9 个）**：
- `core/lib/eventBus.ts` — 模块通信唯一通道
- `core/lib/authInterceptor.ts` — JWT 注入/续签/登出
- `modules/calendar/store/calendarStore.ts` — 日历核心状态
- `modules/calendar/hooks/useCategories.ts` — 分类 CRUD
- `modules/calendar/hooks/useTags.ts` — 标签 CRUD
- `modules/calendar/components/EventModal.tsx` — 创建/编辑弹窗
- `modules/calendar/components/EventForm.tsx` — 表单逻辑
- `pages/LoginPage.tsx` — 认证入口
- `App.tsx` — 路由守卫 + AuthGuard + 模块装配

**P1 — 重要功能补选（15+ 个）**：
- 日历：CalendarView、CalendarSidebar、HomePage、ManagePanel、useKeyboardShortcuts、ics
- 看板：useTasks、BoardView、TaskCard、TaskColumn、TaskForm、TaskToolbar、TodoPage
- 宠物：RoamingPet、PetBubble、SidebarPet、PetPage
- 布局：AppShell、Sidebar、ErrorBoundary、TabbedDialog
- 核心：useNotification、useSseNotifications

### Playwright E2E 基础设施引入

- 安装 `@playwright/test`，配置 `playwright.config.ts`
- 编写 5 条关键路径 E2E 用例：注册→登录→创建日程→完成日程→宠物反应
- CI 集成：GitHub Actions 中新增 E2E 步骤（启动前后端 → 跑 Playwright）

### 非目标
- shadcn/ui 9 个基础组件（第三方库，信任其自身测试）
- SVG 资产（OrangeCat/ShibaInu）——纯视觉，无逻辑
- CSS 文件（themes.css/holiday-themes.css）——视觉效果，不适合自动化测试
- 简单 re-export 文件（index.ts/routes.tsx/colors.ts）

## Capabilities

### New Capabilities

- `frontend-unit-test-coverage`: 为当前缺少测试的源文件编写 vitest 单元测试
- `playwright-e2e-infrastructure`: 引入 Playwright 端到端测试框架及 CI 集成

### Modified Capabilities

无。不修改现有业务代码。

## API Contract Impact

无变更。不修改 `specs/openapi.yaml`。

## DDD Layer Impact

无变更。仅涉及前端测试代码。

## Database Impact

无新增 Flyway 迁移。E2E 测试使用 test profile（H2 内存库）或已有 dev 数据库。

## Impact

- **前端依赖**: 新增 `@playwright/test` devDependency
- **CI**: `.github/workflows/ci.yml` 新增 E2E job/step
- **文档**: 更新 `docs/frontend/component-catalog.md` 测试覆盖统计
- **测试数**: 预计新增 40-60 个单元测试用例 + 5-10 个 E2E 用例
