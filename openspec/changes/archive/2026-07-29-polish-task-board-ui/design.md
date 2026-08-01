# Design: 任务看板 UI 风格统一

## Context

当前任务看板（`src/modules/todo/`）功能完备但视觉风格与日历模块严重割裂。日历模块严格遵循应用设计系统：lucide-react SVG 图标、shadcn/ui 组件（Button/Dialog/Select）、CSS 变量主题色（`bg-surface` / `text-foreground` / `border-border`）、`cn()` 条件 class 工具，且全部通过 5 套主题 + 暗色模式自动适配。

看板模块则全部绕过了这些——emoji 图标、原生 HTML 元素、硬编码 Tailwind 颜色、手动 dark: 前缀。本次变更不做功能改动，仅统一视觉语言。

**关键约束：**
- 只改 `src/modules/todo/` 下的 6 个组件文件 + 对应测试文件
- 零新依赖 — lucide-react 和 shadcn/ui 组件均已在 `frontend/package.json` 中
- 零后端变更 — 无 API、数据库、DDD 影响
- 功能行为 100% 保持 — 拖拽、Mutation、状态流转不变

## Goals / Non-Goals

**Goals:**
- 所有图标从 emoji 迁移至 lucide-react SVG，与应用其余部分一致
- TaskForm 用 shadcn/ui `Dialog` 重写，获得动画 + 模糊遮罩 + 统一圆角
- TaskToolbar / TaskCard / TaskRow 的操作按钮使用 shadcn/ui `Button`
- TaskRow 状态选择器使用 shadcn/ui `Select`
- 颜色从硬编码 Tailwind class 迁移至应用 CSS 变量
- 列宽从固定 `w-80` 改为响应式 `flex-1 min-w-[280px]`

**Non-Goals:**
- 不添加看板功能（子任务、泳道、WIP 限制、批量操作）
- 不添加动画/过渡效果（除非 shadcn/ui 组件自带）
- 不引入新依赖
- 不改动状态管理（Zustand todoStore 不变）
- 不改动数据获取（React Query hooks 不变）

## Decisions

### Decision 1: Icon 映射方案

- **选择**: 用 lucide-react 的语义对应图标替换 emoji
- **理由**: 应用其余部分（CalendarSidebar、EventModal、ManagePanel、LoginPage、shadcn/ui 组件）全部使用 lucide-react；SVG 图标缩放清晰、支持 `currentColor`、与文本基线对齐、受 Tailwind `[&_svg]:size-4` 规则约束
- **备选方案**: @phosphor-icons/react 或 heroicons — 否决，因为 lucide-react 已在项目中且团队已熟悉

**映射表：**

| Emoji | lucide-react | 用途 |
|-------|-------------|------|
| 📋 | `ClipboardList` | TODO 列标题 / 看板视图按钮 |
| 🚀 | `CircleDot` | IN_PROGRESS 列标题 |
| ✅ | `CheckCircle2` | DONE 列标题 |
| 📄 | `List` | 列表视图按钮 |
| ⚠️ | `AlertTriangle` | 过期标记 |
| 📅 | `Calendar` | 截止日期 |
| 🔴🟠🔵⚪ | (移除，用纯文本彩色 Badge) | 优先级标识 |
| 📌 | `Pin` (备用，当前未使用) | — |

优先级改用无图标纯色 Badge（`URGENT=红色`、`HIGH=橙色`、`MEDIUM=蓝色`、`LOW=灰色`），对齐日历模块事件分类 Badge 风格。

### Decision 2: 组件迁移策略

- **选择**: 逐组件替换，不改组件树结构
- **理由**: 组件树已经正确（TodoPage → Toolbar/BoardView/ListView → Column/Card/Row），只需替换叶子组件使用的 HTML 元素为 shadcn/ui 对等组件
- **备选方案**: 整体重写 todo 模块 — 否决，范围过大、引入回归风险

**具体替换：**

| 位置 | 当前 | 替换为 |
|------|------|--------|
| TaskForm 外层 | `<div className="fixed...bg-black/40">` + 内部 `<div>` | `<Dialog>` + `<DialogContent>` + `<DialogHeader>` + `<DialogTitle>` |
| TaskForm 按钮 | `<button>` 取消/保存 | `<DialogFooter>` 内 `<Button variant="outline">` + `<Button>` |
| TaskToolbar 切换 | `<button>` 📋/📄 | `<Button variant="ghost" size="sm">` 带 icon |
| TaskCard 操作 | `<button>` 编辑/删除 | `<Button variant="ghost" size="sm">` |
| TaskRow 状态 | `<select>` + `<option>` | shadcn/ui `<Select>` (onValueChange) |
| TaskColumn 颜色 | `border-{blue,amber,green}-300` | 用 CSS 变量语义色 |

### Decision 3: 颜色系统迁移

- **选择**: 引用 `themes.css` 中定义的 CSS 变量 + Tailwind v4 `@theme` 注册的语义类
- **理由**: 确保 5 套主题（default/warm/nature/dark/lavender）全部自动适配
- **备选方案**: 继续用 `dark:` 手动适配 — 否决，与主题系统脱节

**颜色映射表：**

| 硬编码值 | 替换为 | 说明 |
|----------|--------|------|
| `bg-white dark:bg-gray-800` | `bg-surface` | 卡片/容器背景 |
| `bg-gray-50 dark:bg-gray-900` | `bg-surface-elevated` | 列背景 |
| `border-gray-200 dark:border-gray-700` | `border-border` | 边框 |
| `text-gray-800 dark:text-gray-100` | `text-foreground` | 主文字 |
| `text-gray-500` | `text-foreground-muted` | 次要文字 |
| `bg-gray-100 dark:bg-gray-700` | `bg-hover` | 悬停/切换背景 |
| `bg-blue-500` | `bg-accent` | 主操作按钮 |
| `text-blue-500` | `text-accent` | 链接色 |
| `text-red-500` | `text-red-500` 保持 | 删除/过期（语义色不变） |
| `bg-red-500` (URGENT badge) | `bg-red-500` 保持 | 优先级语义色 |
| 列边框 `border-blue-300` | `border-blue-300` 过渡 | 拖拽高亮（后续可考虑语义变量） |

### Decision 4: 列布局响应式

- **选择**: `flex-1 min-w-[280px] basis-0` 替代固定 `w-80`
- **理由**: `w-80` (320px) 在 1920px 屏幕上三列仅占 960px，浪费约 50% 宽度；`flex-1` 让三列均分可用空间，`min-w-[280px]` 保证最小可用宽度，`basis-0` 确保等宽
- **备选方案**: CSS Grid `grid-cols-3` — 否决，因为拖拽需要保持 flex 行为 + 水平滚动作为小屏兜底

## DDD Layer Design

无后端变更。本变更完全在前端 `src/modules/todo/components/` 范围内。

## API Design

无 API 变更。

## Database Design

无数据库变更。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| **测试断言依赖 emoji 文本** — 测试中可能有 `toBe('📋 看板')` 之类的断言 | 逐项更新测试文件，匹配新的 lucide SVG 渲染结果 |
| **暗色模式回归** — 颜色迁移时可能遗漏某些 `dark:` 覆盖 | 实施后跑全部 5 套主题的视觉检查（light + dark） |
| **shadcn/ui Select vs 原生 select** — Select 的触发交互（Popover）与原生 `<select>` 不同 | TaskRow 中的状态切换频率低，交互差异可接受 |
| **Dialog 内容溢出** — 切换为 Dialog 后 `max-h-[90vh]` 可能裁剪 TaskForm | TaskForm 表单短小（4 字段），不会触发溢出；Dialog 自带 `overflow-y-auto` |

## Migration Plan

1. 部署：标准前端构建 `pnpm run build` → Docker 镜像替换
2. 回滚：前端仅涉及组件渲染，git revert + 重新构建即可
3. 无数据迁移、无后端重启、无用户影响

## Open Questions

- **列边框色 (`border-blue-300`/`amber-300`/`green-300`)** 目前无对应的语义变量。后续可扩展 `themes.css` 添加 `--color-column-todo` / `--color-column-inprogress` / `--color-column-done`，但本次暂用固定色值，因为拖拽高亮是短暂的交互态，视觉影响有限。
