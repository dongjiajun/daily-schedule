# Tasks: 修复模块路由 & 侧边栏 UI 打磨

纯前端变更，无数据库/后端/契约变更。跳过 1-6 分组。

## 7. 前端 (frontend/src/)

### 7.1 路由修复 — 消除 Pet/Todo 空白页
- [x] 7.1.1 `modules/pet/routes.tsx`: `lazy` 改为 `element: <PetPage />`（eager loading，与 calendar 一致）
- [x] 7.1.2 `modules/todo/routes.tsx`: `lazy` 改为 `element: <TodoPage />`（eager loading，与 calendar 一致）

### 7.2 侧边栏导航 — 横向改纵向
- [x] 7.2.1 `components/layout/Sidebar.tsx` 模块导航区域:
  - `flex gap-1` → `flex-col gap-1`
  - 每个按钮 `w-full`，确保文字不溢出

### 7.3 宠物面板主题化
- [x] 7.3.1 `modules/pet/components/PetPanel.tsx`:
  - `bg-white border-gray-200` → `bg-surface/90 backdrop-blur border-border-subtle`
  - 宽度 140px → 180px，`rounded-2xl shadow-lg`
  - 内边距和对齐调整
- [x] 7.3.2 `modules/pet/components/PetAvatar.tsx`:
  - 默认 size 80 → 120（在 PetPanel 中调用处）
  - 添加 framer-motion 浮动动画（`y` 轴 ±4px 循环）
- [x] 7.3.3 `modules/pet/components/PetBubble.tsx`:
  - 背景 `#fff` → `bg-surface/95 backdrop-blur`
  - 文字 `#333` → `text-foreground`
  - 阴影统一为 `shadow-lg`
- [x] 7.3.4 `modules/pet/components/PetStatus.tsx`:
  - 进度条颜色改用 CSS 变量 `--color-accent`（通过 Tailwind `bg-accent`）
  - 文字颜色改用 `text-foreground-secondary`
  - 骨架屏颜色改用 `bg-muted`

### 7.4 前端测试
- [x] 7.4.1 运行 `pnpm run test` 确认存量测试通过

## 8. 文档同步
- [x] 8.1 是否有新前端组件？无（仅修改现有组件）
- [x] 8.2 是否有新实体/表/字段？无
- [x] 8.3 是否有新 API 端点？无
- [x] 8.4 是否有架构/模块变动？无

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + test 全部通过
- [x] 9.3 Smoke test — 启动前后端，浏览器验证关键路径：
  - [x] 登录 → 首页日程管理正常显示（calendar 模块不受影响）
  - [x] 点击「宠物」导航 → `/pet` 页面正常渲染（PetPage）
  - [x] 点击「任务看板」导航 → `/todo` 页面正常渲染（TodoPage）
  - [x] 侧边栏三模块导航纵向排列，文字不溢出
  - [x] 宠物面板右下角显示，毛玻璃风格与主题统一
