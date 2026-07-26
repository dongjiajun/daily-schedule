# Tasks: 前端测试覆盖补全 + Playwright E2E 引入

本变更不修改业务代码，仅编写测试。

## 1. P0 单元测试 — 核心库与认证

- [x] 1.1 编写 `core/lib/__tests__/eventBus.test.ts` — on/emit/off/removeAll/多监听器/事件类型安全 ✅
- [x] 1.2 编写 `core/lib/__tests__/authInterceptor.test.ts` — Bearer 注入/过期续签/401 登出/单飞锁 ✅
- [x] 1.3 编写 `pages/__tests__/LoginPage.test.tsx` — 登录表单/注册表单切换/提交/错误显示 ✅

## 2. P0 单元测试 — 日历状态管理

- [x] 2.1 编写 `modules/calendar/store/__tests__/calendarStore.test.ts` — 初始状态/视图切换/弹窗开关/筛选/打开关闭创建模态框 ✅
- [x] 2.2 编写 `modules/calendar/hooks/__tests__/useCategories.test.ts` — queryFn/分类列表/create/update/delete ✅
- [x] 2.3 编写 `modules/calendar/hooks/__tests__/useTags.test.ts` — queryFn/标签列表/create/update/delete ✅

## 3. P0 单元测试 — 日历组件

- [x] 3.1 编写 `modules/calendar/components/__tests__/EventForm.test.tsx` — 字段渲染/必填校验/默认值/提交回调 ✅
- [x] 3.2 编写 `modules/calendar/components/__tests__/EventModal.test.tsx` — 打开/关闭/提交/删除确认 ✅

## 4. P0 单元测试 — 应用入口

- [x] 4.1 编写 `src/__tests__/App.test.tsx` — AuthGuard 未认证→LoginPage / 已认证→AppShell ✅

## 5. P1 单元测试 — 日历模块

- [x] 5.1 编写 `modules/calendar/hooks/__tests__/useKeyboardShortcuts.test.ts` — 键盘事件绑定
- [x] 5.2 编写 `modules/calendar/lib/__tests__/ics.test.ts` — ICS 内容生成/文件名格式
- [x] 5.3 编写 `modules/calendar/components/__tests__/CalendarView.test.tsx` — 视图渲染/日程显示
- [x] 5.4 编写 `modules/calendar/components/__tests__/CalendarSidebar.test.tsx` — 筛选/搜索/统计数据
- [x] 5.5 编写 `modules/calendar/components/__tests__/HomePage.test.tsx` — 组合 CalendarView + EventModal（由 E2E 覆盖）
- [x] 5.6 编写 `modules/calendar/components/__tests__/ManagePanel.test.tsx` — 分类/标签/偏好设置标签

## 6. P1 单元测试 — 任务看板模块

- [x] 6.1 编写 `modules/todo/hooks/__tests__/useTasks.test.ts` — queryFn/CRUD/moveTask
- [x] 6.2 编写 `modules/todo/components/__tests__/TaskForm.test.tsx` — 字段渲染/默认值/优先级选择
- [x] 6.3 编写 `modules/todo/components/__tests__/TaskCard.test.tsx` — 标题/优先级/标签/逾期日期渲染
- [x] 6.4 编写 `modules/todo/components/__tests__/TaskColumn.test.tsx` — 标题/计数徽章/卡片列表/drop 区域
- [x] 6.5 编写 `modules/todo/components/__tests__/BoardView.test.tsx` — 三列布局/拖拽回调
- [x] 6.6 编写 `modules/todo/components/__tests__/TodoPage.test.tsx` — 看板/列表视图切换
- [x] 6.7 编写 `modules/todo/components/__tests__/TaskToolbar.test.tsx` — 视图切换/新建按钮
- [x] 6.8 编写 `modules/todo/components/__tests__/TaskRow.test.tsx` — 列表行/状态下拉框
- [x] 6.9 编写 `modules/todo/components/__tests__/ListView.test.tsx` — 任务行列表/排序控件

## 7. P1 单元测试 — 宠物模块

- [x] 7.1 编写 `modules/pet/components/__tests__/PetBubble.test.tsx` — 气泡消息渲染/显示隐藏
- [x] 7.2 编写 `modules/pet/components/__tests__/SidebarPet.test.tsx` — 迷你宠物渲染/状态指示点
- [x] 7.3 编写 `modules/pet/components/__tests__/RoamingPet.test.tsx` — 游走逻辑/点击交互/hover 状态
- [x] 7.4 编写 `modules/pet/components/__tests__/PetPage.test.tsx` — 宠物详情页渲染

## 8. P1 单元测试 — 布局组件与核心

- [x] 8.1 编写 `core/hooks/__tests__/useNotification.test.ts` — 浏览器通知 API mock
- [x] 8.2 编写 `core/hooks/__tests__/useSseNotifications.test.ts` — EventSource mock/重连逻辑
- [x] 8.3 编写 `core/components/layout/__tests__/TabbedDialog.test.tsx` — 标签切换/受控非受控模式
- [x] 8.4 编写 `components/layout/__tests__/ErrorBoundary.test.tsx` — 错误捕获/fallback UI/重载按钮
- [x] 8.5 编写 `components/layout/__tests__/Sidebar.test.tsx` — 模块导航渲染/活跃模块高亮
- [x] 8.6 编写 `components/layout/__tests__/AppShell.test.tsx` — 侧边栏+内容区布局

## 9. Playwright E2E 基础设施

- [x] 9.1 安装 `@playwright/test` devDependency
- [x] 9.2 创建 `frontend/playwright.config.ts` — testDir './e2e', webServer（backend test profile + Vite dev）, baseURL
- [x] 9.3 安装 Playwright Chromium 浏览器 (`pnpm exec playwright install chromium`)
- [x] 9.4 在 `frontend/package.json` 添加 `test:e2e` 和 `test:e2e:ui` 脚本

## 10. Playwright E2E 用例

- [x] 10.1 编写 `e2e/auth.spec.ts` — 注册新用户 → 登录 → 跳转日历首页
- [x] 10.2 编写 `e2e/calendar.spec.ts` — 创建日程 → 月视图可见 → 编辑 → 完成日程
- [x] 10.3 编写 `e2e/task.spec.ts` — 创建任务 → 拖拽 TODO→DONE → 刷新持久化
- [x] 10.4 编写 `e2e/pet.spec.ts` — 完成日程后宠物粒子效果触发

## 11. CI 集成

- [x] 11.1 在 `.github/workflows/ci.yml` 新增 E2E step（安装 Playwright browsers + 运行 test:e2e）
- [x] 11.2 确认 CI 中 E2E 在 backend 和 frontend jobs 之后或独立 job 执行

## 12. 全量验证

- [ ] 12.1 `cd frontend && pnpm run test` — 所有新增单元测试通过
- [ ] 12.2 `cd frontend && pnpm run lint` — 零 ESLint 错误
- [ ] 12.3 `cd frontend && pnpm run test:e2e` — E2E 全部通过
- [ ] 12.4 更新 `docs/frontend/component-catalog.md` — 测试覆盖统计
