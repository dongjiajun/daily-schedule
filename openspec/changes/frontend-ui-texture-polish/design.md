# Design: frontend-ui-texture-polish

## Context

当前前端采用 Tailwind CSS v4（`@theme` 语义变量）+ 23 套主题 CSS（5 基础 + 18 节日，`design-tokens.json` 为唯一真相源）+ shadcn/ui & 自研原语（17 个）+ Zustand + React Query。近期探索审计发现了四处质感断层：
1. `themes.css` 的 `dark` 主题 `--color-border-subtle`（`#1e293b`）与 `--color-surface`（`#1e293b`）同色，`holiday-themes.css` 的 `--color-surface-elevated` 与 `--color-surface` 同色，导致暗色系下卡片与弹窗细边框隐身、表面无分层。
2. `index.css` 阴影偏薄，`DialogContent` 缺少边框，`TaskCard` / `CalendarSidebar` 存在 `shadow-card ... hover:shadow-card` 无效过渡，`Segmented` 无滑动过渡，`Button` 使用未注册裸 `shadow`。
3. `Todo` 模块表单与内联新建仍用原生 `<input>`/`<textarea>`/`<select>`，列表完成态缺乏删除线。
4. `calendar.css` 中文星期表头使用 `uppercase` + `0.1em` 字距，`PetPage` 主卡缺乏空间衬底且道具区未做网格排布。

约束：`ui:check` 门禁严格禁止白名单外 `.tsx` 出现裸色值/契约外几何与动效值，强制保持 40 个 `--color-*` token 与对比度；`e2e/ui-primitives.spec.ts` 精确断言 `Segmented` 计算高度（comfortable 32px / compact 28px）；`e2e/todo-board-interaction.spec.ts` 依赖 `TaskColumn` `h3 -> .. -> ..` DOM 层级定位。

## Goals / Non-Goals

**Goals:**
- 统一按「克制精致派（Linear / Apple Calendar 路线）」打磨 Token 光影、交互原语手感与日历/待办/宠物三大模块视觉一致性。
- 修复深色与节日主题隐形细边框、`shadow-card -> hover:shadow-card` 无效悬停、待办原生控件残留与日历 CJK 表头排版违例。
- 保持 100% 向后兼容已有 E2E 选择器、无障碍属性、`prefers-reduced-motion` 降级与 `ui:check` 门禁，并同步刷新 30 张 `@visual` 截图基线。

**Non-Goals:**
- 不改动后端代码、数据库、`specs/openapi.yaml` 契约、认证逻辑或新增外部 npm 依赖。
- 不修改微信小程序 `apps/miniprogram/`（小程序使用 Taro + NutUI 独立样式体系）。
- 不调整主题色整体色调（保留 5 套基础主题身份色与 18 套节日配色种子）。

## Decisions

### Decision 1: 暗色表面分级 + `index.css` 投影高光覆写（不新增颜色 token）
- **选择**：直接在 `themes.css`（`dark` 设 `--color-border-subtle: #293548`、`--color-surface-elevated: #243044`）与 `holiday-themes.css`（`--color-surface-elevated` 混入 7% accent、`--color-border-subtle` 基于 `18% accent + surface`）拉开层次；将三档复合投影写入 `design-tokens.json` 与 `index.css`，并在 `index.css` 中为 `[data-theme="dark"]` 与 `[data-theme^="holiday-"]` 覆盖 `--shadow-card`/`--shadow-float`/`--shadow-overlay` 添加 `inset 0 1px 0 0 rgb(255 255 255 / 0.05..0.08)` 顶部微高光。
- **理由**：`tokens.mjs` 解析 `themes.css` 中的 `--color-*` 变量并校验 40 token 清单，把 `--shadow-*` 暗色高光放在 `index.css` 可避免污染颜色契约计数；使用显式 hex 更新 `dark` 主题确保 `design-tokens.test.ts` 的派生跳过计数器不增长。
- **备选方案**：在 `design-tokens.json` 新增 `--color-rim-highlight` 等新颜色 token。否决原因：需同步给全部 23 套主题补声明并改动契约总数测试断言，属于过度设计。

### Decision 2: `Segmented` 使用同实例 `layoutId` 弹性指示底片且按钮本身不加边框
- **选择**：引入 `framer-motion` 的 `<motion.span layoutId={pillId} />`（`pillId = React.useId()`）渲染激活胶囊底片，搭配 `spring(stiffness: 420, damping: 32)`；外层轨道增加 `border border-border-subtle`，而内部 `<button role="radio">` 不设边框。
- **理由**：外层带 `useId()` 隔离可避免同一页面出现多个 `Segmented`（如 Todo 列表视图的工具栏与排序栏同时存在）时 `layoutId` 跨组乱飞；不给 `<button>` 加 border 可保证 `e2e/ui-primitives.spec.ts` 对 `comfortable=32px`、`compact=28px` 的精确高度断言继续成立；根部 `<MotionConfig reducedMotion="user">` 会自动在系统开启减弱动态时降级动画。
- **备选方案**：纯 CSS `transition-all` 或计算偏移量滑块。否决原因：选项宽度不等时 CSS 计算滑块需额外 `ResizeObserver` / DOM 测量，易在单元测试 jsdom 下出现 `0px` 闪烁；仓库已内置 `framer-motion`。

### Decision 3: 待办模块组件原语收敛与 E2E DOM 契约兼容
- **选择**：将 `TaskForm` 与 `TaskColumn` 内联快速新建迁移到 `Label` / `Input` / `Textarea` / Radix `Select`，`TaskCard` 与 `TaskRow` 优先级迁移至 `<Badge tone="...">`；保留 `TaskColumn` `outer div > header div > h3` 嵌套深度、`bg-surface-elevated` / `rounded-xl` / `min-w-[280px]` 类名、`新建` 按钮精确文本、`TaskForm` 标题 `Input` 的 `name="title"` 与 `placeholder="输入任务标题"`，以及 `TaskCard` 常驻 `编辑`/`删除` 按钮与 `Select` 状态触发器。
- **理由**：在不削弱设计系统一致性的前提下，保持 `todo-crud.spec.ts` 与 `todo-board-interaction.spec.ts` 全部交互与触摸端测试零破坏；`TaskCard` 的 `isDragging` 状态（`opacity-50 scale-[0.98]`）提供直观拖拽反馈而不影响 HTML5 `dataTransfer` 行为。
- **备选方案**：重构 `TaskColumn` 内部包装层或改为 `dnd-kit`。否决原因：更换拖拽库超出视觉打磨范围且会破坏既有 E2E 鼠标拖拽脚本。

### Decision 4: 日历表头排版合规与格内微框架
- **选择**：移除 `calendar.css` 中 `.rbc-header` 的 `text-transform: uppercase` 与 `letter-spacing: 0.1em`，改为自然字距 `0.02em`、`font-size: 12px`；为 `.rbc-day-bg` 增加 `inset 0 0 0 1px var(--color-cal-border)` 微框线并降低 `.rbc-off-range-bg` 对比；`EventItem` 对时间前缀应用 `tabular-nums`；空状态引导浮层使用轻量 `Card` 式磨砂徽标居中呈现。
- **理由**：同时消除 `frontend-experience-baseline` 中明确的 CJK 表头规范隐患，解决深/浅色主题下月视图日期数字"悬空"问题，并通过 `inset box-shadow` 避开 `react-big-calendar` 表格宽度塌缩/溢出风险。
- **备选方案**：直接给 `.rbc-day-bg` 加 1px solid border。否决原因：`react-big-calendar` flex-basis 与横向 margin 计算对外部 border 敏感，易导致 7 列跨行折行。

### Decision 5: `FoodActionList` 布局参数化与宠物陈列台氛围衬底
- **选择**：在 `PetPage` 主卡宠物形象外层包装轻量主题径向光晕与地面椭圆投影（均标记 `aria-hidden="true"`，内层 `<PetAvatar size={200} />` 保持原样无额外 CSS transform），并为 `FoodActionList` 增加 `layout?: 'list' | 'grid'`（默认 `'list'`，专页传入 `'grid'`，移动端 `grid-cols-1`，`sm:` 及以上双列）；`PetMenu` 切回 `<Segmented size="sm">` 并保留「喂食 / 商店」文案。
- **理由**：`PetPage.test.tsx` 显式断言主头像 `svg[width="200"]` 且 `svg.style.transform === ''`；陈列台衬底置于父容器背景，既带来空间立体感又不改动 `SvgAvatar` / `PetAvatar` 内部坐标与动画状态机。
- **备选方案**：在 `PetPage` 复制一套网格渲染逻辑替代 `FoodActionList`。否决原因：会造成喂食/购买反馈逻辑重复，违反共享组件单一来源原则。

## DDD Layer Design

### 领域层 (domain/)
不适用（纯前端视觉与组件原语打磨，后端领域层无变更）。

### 基础设施层 (infrastructure/)
不适用（无持久化/安全/定时/推送变更）。

### 应用层 (application/)
不适用（无应用服务变更）。

### API 层 (api/)
不适用（无 Controller/Assembler 变更）。

### 前端 (frontend/src/)
- **Token 与样式层**：`frontend/src/core/styles/{design-tokens.json,themes.css,holiday-themes.css}`、`frontend/src/index.css`
- **Core UI 原语与 Shell**：`frontend/src/core/components/ui/{button.tsx,segmented.tsx,dialog.tsx}`、`frontend/src/components/layout/Sidebar.tsx`
- **Calendar 模块**：`frontend/src/modules/calendar/components/{calendar.css,CalendarView.tsx,CalendarSidebar.tsx}`
- **Todo 模块**：`frontend/src/modules/todo/components/{TaskToolbar.tsx,TaskForm.tsx,TaskColumn.tsx,TaskCard.tsx,TaskRow.tsx,ListView.tsx}`
- **Pet 模块**：`frontend/src/modules/pet/components/{PetPage.tsx,PetStatus.tsx,FoodActionList.tsx,PetMenu.tsx}`

## API Design

无影响（`specs/openapi.yaml` 零变更，无需重新生成前后端接口或 SDK）。

## Database Design

不适用（无数据库表/列变更，无需 Flyway 脚本）。

## Risks / Trade-offs

- **风险 1：`ui:check` 第 3/4/6 检误触契约外阴影或圆角/透明度修饰** → 所有阴影、颜色、时长改动优先使用契约内 token（如 `duration-fast`、`shadow-card`、`shadow-float`、`bg-hover/60`），绝不写 `shadow-card/50`、`rounded-3xl` 或裸 hex；每次编辑后立刻跑 `pnpm run ui:check` 验证。
- **风险 2：`Segmented` 重构影响现有高度断言或 `PetMenu` 单元测试选择器** → 严格保留 `radiogroup`/`radio` 角色、`aria-checked` 与精确高度 class，不给 `<button role="radio">` 加边框；用 `vitest` 和 `ui-primitives.spec.ts` 实测回归。
- **风险 3：30 张 `@visual` 截图在刷新基线时受游走宠物或时间漂移影响** → 沿用 `e2e/visual.spec.ts` 既有时间冻结与隐藏 `[data-testid="roaming-pet"]` 机制，更新后抽检明暗截图并再次不带 `--update-snapshots` 重跑一次确认零抖动。

## Review Checklist

- [x] 失败路径是否覆盖？（已涵盖减弱动态降级、拖拽取消/同列回弹、空白名称/专注币不足禁用、以及暗色/节日主题对比度门禁兜底）
- [x] 回滚/降级方案是什么？（纯前端样式与组件表现层变更，无 DB/API 状态迁移；若单模块效果不理想可按 git 文件粒度或 Layer 独立回退，视觉基线可同步还原）
- [x] 契约/DB 兼容性影响？（零 OpenAPI 变更，零 DB 迁移，现有前端路由/Zustand 持久化 key/E2E 选择器全兼容）

## Migration Plan

1. 更新设计 token、样式与 Core 原语，运行 `pnpm run ui:check`。
2. 依次落地 Calendar、Todo、Pet 三个模块打磨并扩展对应 Vitest 用例。
3. 运行全量 lint/build/test 门禁与非视觉 E2E 测试，随后通过 `pnpm run test:visual -- --update-snapshots` 更新 30 张基线图并人工核查关键明暗截图。
4. 同步文档（`component-catalog.md` / `AGENTS.md` / `README.md`）并完成 `openspec:check` 与 `docs:check`。

## Open Questions

无（视觉方向「克制精致派」与全站一体化范围「Option A」已在探索阶段确认完毕）。
