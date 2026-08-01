# Proposal: 任务看板 UI 风格统一

## Why
任务看板（todo 模块）功能正常，但视觉风格与整个应用的简约精致设计语言严重不一致——大量使用 emoji 替代图标、绕过了已有的 shadcn/ui 组件体系、硬编码颜色脱离主题系统。用户在日历模块和看板之间切换时能感受到明显的"粗糙感"，损害了 v3.3.0 已建立的高品质视觉体验。

## What Changes
- 将所有 emoji 图标（📋🚀✅⚠️📅📄🔴🟠🔵⚪）替换为 lucide-react SVG 图标
- TaskCard / TaskRow 使用 shadcn/ui `Button` 替代原生 `<button>`
- TaskForm 使用 shadcn/ui `Dialog` 替代手写模态框
- 硬编码 Tailwind 颜色（`bg-gray-*`、`bg-blue-500` 等）替换为应用 CSS 变量（`bg-surface`、`text-foreground` 等）
- 看板列宽从固定 `w-80` 改为响应式（`flex-1` + `min-w-0`）
- 统一圆角为 `rounded-xl`（与应用其余部分对齐）
- TaskToolbar 视图切换引入 `focus-visible:ring` 和无障碍属性
- 引入 `cn()` 工具处理条件 class 拼接

## Capabilities

### New Capabilities
<!-- 无新增能力，纯视觉/一致性优化 -->

### Modified Capabilities
- `task-kanban`: UI 风格统一，图标、组件、颜色对齐应用设计系统，功能行为不变

## API Contract Impact
无影响。纯前端视觉层变更，不涉及 API 端点、请求/响应结构。

## DDD Layer Impact
无影响。不涉及后端任何层。

## Database Impact
无需 Flyway 迁移。

## Impact
| 范围 | 详情 |
|------|------|
| **核心改动文件** | `src/modules/todo/components/TaskCard.tsx`、`TaskRow.tsx`、`TaskColumn.tsx`、`TaskToolbar.tsx`、`TaskForm.tsx`、`ListView.tsx` |
| **依赖** | 已安装的 `lucide-react`（无新增依赖） |
| **shadcn/ui 复用** | `Button`、`Dialog`、`Select`（均已存在） |
| **测试** | 更新 `TaskCard.test.tsx`、`TaskColumn.test.tsx`、`TaskToolbar.test.tsx`、`TodoPage.test.tsx` 中与 emoji/class 相关的断言 |
| **文档** | 更新 `docs/frontend/component-catalog.md` 中看板组件描述 |
| **风险评估** | 极低 — 无 API 变更、无状态管理变更、无路由变更，回归范围仅限 todo 模块组件 |
