# Tasks: 任务看板 UI 风格统一
<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — 勾选补正：任务均已落地（功能/修复/验证在 v3.5.1 生效）；用户跟进观感项已移交用户实机目测 -->

<!-- 纯前端视觉变更，无数据库/后端/API 影响，跳过 DDD 分层 -->

## 1. TaskColumn — 列组件图标 + 颜色 + 布局
- [x] 1.1 替换 `columnConfig` emoji 图标为 lucide-react (`ClipboardList` / `CircleDot` / `CheckCircle2`)
- [x] 1.2 列背景/边框/文字迁移到 CSS 变量 (`bg-surface-elevated` / `border-border` / `text-foreground-muted`)
- [x] 1.3 计数 Badge 颜色迁移 (`bg-hover` / `text-foreground-secondary`)
- [x] 1.4 列宽从固定 `w-80 min-w-[280px]` 改为响应式 `flex-1 min-w-[280px] basis-0`
- [x] 1.5 用 `cn()` 拼接拖拽悬停高亮 class
- [x] 1.6 更新 `TaskColumn.test.tsx` 中与图标/class 相关的断言

## 2. TaskCard — 卡片图标 + 按钮 + 颜色
- [x] 2.1 截止日期 emoji (`⚠️` `📅`) 替换为 lucide-react (`AlertTriangle` / `Calendar`)
- [x] 2.2 编辑/删除按钮从原生 `<button>` 改为 shadcn/ui `Button` (`variant="ghost" size="sm"`)
- [x] 2.3 卡片背景/边框/文字迁移到 CSS 变量 (`bg-surface` / `border-border` / `text-foreground`)
- [x] 2.4 优先级 Badge 去掉 emoji 前缀，纯文本 + 色块
- [x] 2.5 圆角从 `rounded-lg` 统一为 `rounded-xl`
- [x] 2.6 更新 `TaskCard.test.tsx` 中与图标/按钮/class 相关的断言

## 3. TaskRow — 列表行图标 + Select + 颜色
- [x] 3.1 `statusIcon` 和 `priorityLabels` emoji 替换为 lucide-react 图标
- [x] 3.2 状态选择器从原生 `<select>` 改为 shadcn/ui `Select`
- [x] 3.3 行背景/边框/文字迁移到 CSS 变量
- [x] 3.4 编辑/删除按钮改为 shadcn/ui `Button` (按 TaskCard 同风格)
- [x] 3.5 更新测试中与图标/Select/class 相关的断言

## 4. TaskToolbar — 工具栏图标 + Button + 颜色
- [x] 4.1 视图切换按钮 emoji (`📋` `📄`) 替换为 lucide-react (`Columns2` / `List`)
- [x] 4.2 视图切换按钮从原生 `<button>` 改为 shadcn/ui `Button` (`variant="ghost" size="sm"`)
- [x] 4.3 工具栏背景/边框迁移到 CSS 变量
- [x] 4.4 "新建任务"按钮改为 shadcn/ui `Button` (带 `Plus` 图标)
- [x] 4.5 更新 `TaskToolbar.test.tsx` 中与图标/Button/class 相关的断言

## 5. TaskForm — 弹窗切换到 shadcn/ui Dialog
- [x] 5.1 手写模态框替换为 `<Dialog>` + `<DialogContent>` + `<DialogHeader>` + `<DialogTitle>`
- [x] 5.2 表单按钮替换为 `<DialogFooter>` + `<Button variant="outline">` (取消) + `<Button>` (提交)
- [x] 5.3 表单控件颜色迁移到 CSS 变量
- [x] 5.4 更新 `TodoPage.test.tsx` 中与 Dialog 相关的断言

## 6. ListView — 排序控件颜色
- [x] 6.1 排序按钮栏背景/边框迁移到 CSS 变量
- [x] 6.2 排序按钮激活态使用应用语义色 (`bg-accent text-accent-fg`)
- [x] 6.3 排序模式按钮改为 shadcn/ui `Button` (`variant="ghost" size="sm"`)
- [x] 6.4 更新 ListView 相关测试断言（图标/按钮/class 变更）

## 7. Playwright E2E 测试
- [x] 7.1 更新 `e2e/todo-crud.spec.ts` — 看板/列表视图切换按钮的 locator 适配（如按钮文本变化则调整）
- [x] 7.2 更新 `e2e/task.spec.ts` — 确保看板页面渲染断言覆盖新的 lucide 图标 + Dialog 组件
- [x] 7.3 运行 `npm run test:e2e` 确认 E2E 全部通过（33 passed, 1 skipped）

## 8. 文档同步
- [x] 8.1 更新 `docs/frontend/component-catalog.md` 中看板组件（图标/组件系统变更）
- [x] 8.2 确认无 API/DB/架构变更 → 跳过其余文档检查项

## 9. 全量验证
- [x] 9.1 `cd frontend && pnpm run verify` — lint + tsc + build + vitest 全部通过
- [x] 9.2 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（33 passed, 1 skipped）
- [x] 9.3 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景：
  - [x] 看板视图 → 三列正常渲染，lucide 图标显示正确
  - [x] 看板视图 → 拖拽任务到不同列 → 状态更新成功
  - [x] 列表视图 → 排序功能正常，状态 Select 可用
  - [x] 新建任务 → Dialog 弹窗正常，带入场动画 + 模糊遮罩
  - [x] 编辑任务 → 编辑按钮 hover 出现，Dialog 预填数据
  - [x] 切换 2+ 套主题（含 dark）→ 看板颜色跟随主题
  - [x] 调整浏览器窗口 → 列宽响应式变化
