# Tasks: frontend-quick-polish

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
-->

## 1. 数据库迁移
- [x] N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] N/A — 纯前端变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 纯前端变更

## 4. 应用层 (application/)
- [x] N/A — 纯前端变更

## 5. API 层 (api/)
- [x] N/A — 纯前端变更

## 6. 契约同步
- [x] N/A — 契约零变更，无需重生成 SDK、无需同步版本号

## 7. 前端 (frontend/src/)
- [x] 7.1 安装 `tw-animate-css` 依赖 + 在 Tailwind 入口 CSS 加 `@import "tw-animate-css"`；验证构建产物中 `animate-in`/`zoom-in-95` 类有 CSS 命中（不再零命中）
- [x] 7.2 pet 模块类名替换：`bg-muted` → `bg-hover`、`text-muted-foreground` → `text-foreground-muted`（PetMenu.tsx:77、PetStatus.tsx:14,26、PetPage.tsx:55-68、PetSelection.tsx:54,70、SidebarPet.tsx:77，实施时全量 grep 确认无遗漏）
- [x] 7.3 `index.html`：`lang="en"` → `lang="zh-CN"` + 补 `<meta name="theme-color">`（与默认主题背景一致）；`manifest.webmanifest` 的 `theme_color` 固定蓝 → 同色对齐
- [x] 7.4 `App.tsx` 根节点包裹 `<MotionConfig reducedMotion="user">`（与 AuthGuard 平级最外层）
- [x] 7.5 vitest：无新逻辑，运行现有 50 文件全量核对通过（如 pet 组件测试断言 className 则同步更新）
- [x] 7.6 Playwright E2E：无行为变更，核对现有 spec 通过（重点 pet.spec.ts 因类名替换）
- [x] 7.7 运行 `npm run test:e2e` 确认 E2E 全部通过

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 勘误：`routes.tsx  # lazy 路由定义` → `静态路由定义`（与实现一致）；其余核对
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/领域模型变更 → 核对结论：现有描述已核对仍准确
- [x] 8.3 `docs/api/overview.md` — 无端点/契约变更 → 核对结论：现有描述已核对仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 无架构/测试规模变化 → 核对结论：现有描述已核对仍准确
- [x] 8.5 `README.md` — 无版本/功能清单变化 → 核对结论：现有描述已核对仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端无改动，核对通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 42 过 0 挂 1 跳过
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证（Playwright 驱动真实浏览器 4/4 通过）：
  - [x] 打开事件编辑弹窗 → 带缩放/淡入过渡动画（animationName=enter, 0.15s）
  - [x] 展开任意 Select/Popover → 带过渡动画（与 Dialog 同机制同依赖：dist CSS 已验证 fade-in-0/slide-in-from 类编译命中）
  - [x] 宠物状态面板进度条轨道有背景色（亮色 #f3f4f6 已实测）、标签颜色正确（#9ca3af 已实测）——暗色等主题同 token 机制（themes.css 5 套主题均已定义 --color-hover/--color-foreground-muted）
  - [x] 系统开启"减少动态效果"（Playwright reducedMotion=reduce 模拟）→ 媒体查询命中 + 弹窗动画实测压缩至 0.01ms + 页面正常渲染无错误（MotionConfig + CSS 媒体查询双层覆盖，verify 后增强）
