# Proposal: frontend-ui-texture-polish

## Why

当前前端已完成基础功能与性能优化，但在细节质感与组件一致性上存在明显断层：暗色主题 `--color-border-subtle` 与 `--color-surface` 同色导致细边框隐形、部分交互卡片 `shadow-card -> hover:shadow-card` 无悬停抬升反馈、`TaskForm` 与快捷新建仍残留原生 HTML 控件、`calendar.css` 对中文星期表头施加了 `uppercase` 与宽字距，以及 `/pet` 专页卡片过于平铺。围绕“克制精致派（Linear / Apple Calendar 路线）”对设计 token、基础原语与三大业务模块进行一轮一体化打磨，可显著提升全站视觉统一性与交互手感。

## What Changes

- **底座 Token 与基础原语（Layer 1）**：拉开 `dark` 与 `holiday-*` 主题的 `--color-border-subtle` / `--color-surface-elevated` 层次；升级 `design-tokens.json` 与 `index.css` 的 `card`/`float`/`overlay` 多层阴影（暗底附顶部微高光）；为 `Segmented` 增加 `framer-motion` `layoutId` 弹性滑动指示底片；为 `Button` 收敛契约 `shadow-card` 与轻按回弹；为 `DialogContent` 补齐语义细边框；优化 `Sidebar` 活跃导航指示。
- **日历主舞台精雕（Layer 2）**：移除 `calendar.css` 中文表头的 `uppercase` 与过度字距；为月视图日期格与日程条补齐微描边及非当月退后层次，时间前缀采用 `tabular-nums`；对齐侧栏搜索框聚焦环与 `<Kbd>/</Kbd>` 快捷键提示，并修复新建日程按钮无效 hover 阴影。
- **待办模块收口（Layer 3）**：对齐 `TaskToolbar` 与 `CalendarToolbar` 高度/毛玻璃材质；将 `TaskForm` 与 `TaskColumn` 内联新建控件全部迁移至设计系统 `Label`/`Input`/`Textarea`/`Select`；用 `<Badge>` 统一优先级徽标，修复卡片悬停抬升并补拖拽半透明反馈；为列表视图已完成行增加删除线与弱化态。
- **宠物专页陈列台（Layer 4）**：为 `/pet` 主卡宠物形象增加主题径向光晕与脚底椭圆投影，支持 `FoodActionList` 在专页以双列网格呈现（`PetMenu` 浮层保留单列紧凑），并将 `PetMenu` 手写 tab 栏统一替换为 `Segmented` 原语。
- **Workflow Schema 选择**：选用默认档 `spec-driven-custom-standard`（proposal → specs → design → tasks）。理由：本变更横跨设计 token、core 原语与 calendar/todo/pet 三个前端模块，需要 design.md 统筹暗色层次、动效降级与 E2E/视觉基线兼容性，但不涉及后端/数据库/外部新依赖或高风险架构变更，无需 `custom` 档的 `test-plan.md`。
- **无 BREAKING 变更**。

## Capabilities

### New Capabilities

### Modified Capabilities
- `design-token-contract`: 补充暗色与节日主题 `border-subtle` / `surface-elevated` 层级区分及多层阴影/顶部高光契约。
- `component-primitives`: 为 `Segmented`、`Button`、`Dialog` 补充触感与微动效反馈规格，并保留无障碍与减弱动态降级。
- `frontend-experience-baseline`: 明确日历中文表头自然排版、网格与日程条微描边及模块顶栏材质一致性基线。
- `task-kanban`: 更新 `组件体系对齐 shadcn/ui`（覆盖 `TaskForm`/`TaskColumn` 表单原语与 `Badge` 优先级）并新增卡片悬停抬升与拖拽源反馈需求。
- `task-list-view`: 更新 `列表视图渲染`，补充已完成任务行删除线弱化、`Badge` 优先级与等宽日期规格。
- `pet-interaction-ui`: 新增 `/pet` 专页陈列台光影氛围与 `FoodActionList` 双列/单列自适应卡片网格需求。

## API Contract Impact

无影响（`specs/openapi.yaml` 零变更，无新增/修改端点，非 BREAKING）。

## DDD Layer Impact

无后端变更（后端 API / 应用 / 领域 / 基础设施层均不触碰）。

## Database Impact

无需新 Flyway 迁移，无表/列/索引变更。

## Impact

- **前端样式与原语**：`frontend/src/index.css`、`frontend/src/core/styles/{design-tokens.json,themes.css,holiday-themes.css}`、`frontend/src/core/components/ui/{button,segmented,dialog}.tsx`、`frontend/src/components/layout/Sidebar.tsx`
- **业务模块**：`frontend/src/modules/calendar/components/{calendar.css,CalendarView.tsx,CalendarSidebar.tsx}`、`frontend/src/modules/todo/components/{TaskToolbar,TaskForm,TaskColumn,TaskCard,TaskRow,ListView}.tsx`、`frontend/src/modules/pet/components/{PetPage,PetStatus,FoodActionList,PetMenu}.tsx`
- **测试与视觉基线**：`frontend/src/**/__tests__/*.test.tsx`、`e2e/visual.spec.ts-snapshots/*.png`（5 主题 × 6 截面共 30 张快照基线随同刷新）
- **文档**：`docs/frontend/component-catalog.md`、`AGENTS.md`、`README.md`
