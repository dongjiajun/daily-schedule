# Task Kanban

任务看板——三列看板（TODO / IN_PROGRESS / DONE）和列表视图，支持拖拽改状态、排序、CRUD。

## Purpose

提供任务看板模块的视觉设计规范，确保组件与应用的 5 套主题系统（default/warm/nature/dark/lavender）保持一致。

## Requirements

### Requirement: 图标系统对齐应用设计语言
所有看板组件中的图标 SHALL 使用 `lucide-react` SVG 图标，禁止使用 Unicode emoji 字符作为图标。

- 列标题图标：TODO = `ClipboardList`, IN_PROGRESS = `CircleDot`, DONE = `CheckCircle2`
- 视图切换图标：看板 = `Columns2`, 列表 = `List`
- 过期标记图标：`AlertTriangle`（仅当任务逾期且未完成时显示）
- 截止日期图标：`Calendar`
- 优先级标识 SHALL 使用纯文本 Badge（无图标），颜色区分级别（URGENT=红, HIGH=橙, MEDIUM=蓝, LOW=灰）

#### Scenario: 看板视图列标题渲染
- **WHEN** 用户打开任务看板的看板视图
- **THEN** 各列标题显示对应的 lucide-react SVG 图标（非 emoji）

#### Scenario: 视图切换按钮图标
- **WHEN** TaskToolbar 渲染视图切换按钮
- **THEN** "看板"按钮使用 `Columns2` 图标，"列表"按钮使用 `List` 图标

### Requirement: 组件体系对齐 shadcn/ui
看板中所有交互元素 SHALL 使用已有的 shadcn/ui 组件，而非原生 HTML 元素。

- `TaskForm` 弹窗 SHALL 使用 `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogFooter`
- `TaskToolbar` 中的操作按钮 SHALL 使用 `Button`（`variant="ghost" size="sm"`）
- `TaskCard` 中的编辑/删除按钮 SHALL 使用 `Button`（`variant="ghost" size="sm"`）
- `TaskCard` 中的状态切换 SHALL 使用 `Select`（与 `TaskRow` 同款）
- `TaskRow` 中的状态选择器 SHALL 使用 `Select`（来自 shadcn/ui）
- 所有按钮 SHALL 包含图标 + 文字（无障碍友好）

#### Scenario: TaskForm 弹窗使用 Dialog 组件
- **WHEN** 用户点击"新建任务"或"编辑"
- **THEN** 弹出框使用 shadcn/ui Dialog（含 backdrop-blur 遮罩、rounded-2xl 圆角、animate-in 入场动画、X 关闭按钮）

#### Scenario: TaskCard 操作按钮使用 Button 组件
- **WHEN** 用户查看任务卡片
- **THEN** 直接显示 shadcn/ui Button（variant="ghost" size="sm"）的编辑和删除按钮（常驻可见）

#### Scenario: TaskCard 状态切换使用 Select 组件
- **WHEN** 用户查看任务卡片
- **THEN** 卡片显示 shadcn/ui Select 状态下拉（触发项含当前状态图标与文字）

### Requirement: 颜色系统对齐 CSS 变量主题
看板组件的背景、边框、文字颜色 SHALL 使用 `themes.css` 中定义的 CSS 变量（通过 Tailwind v4 `@theme` 注册的语义类），而非硬编码的 Tailwind 颜色值。

- 卡面/容器背景：`bg-surface`（替代 `bg-white dark:bg-gray-800`）
- 列背景：`bg-surface-elevated`（替代 `bg-gray-50 dark:bg-gray-900`）
- 边框：`border-border`（替代 `border-gray-200 dark:border-gray-700`）
- 主文字：`text-foreground`（替代 `text-gray-800 dark:text-gray-100`）
- 次要文字：`text-foreground-muted`（替代 `text-gray-500`）
- 悬停背景：`bg-hover`（替代 `bg-gray-100 dark:bg-gray-700`）
- 主操作色：`bg-accent` / `text-accent-fg`（替代 `bg-blue-500`）
- 系统圆角：`rounded-xl`（替代 `rounded-lg`）

#### Scenario: 主题切换时看板颜色跟随
- **WHEN** 用户切换主题（default/warm/nature/dark/lavender）
- **THEN** 看板组件的背景、边框、文字颜色随 CSS 变量自动适配，无需手动 `dark:` 覆盖

### Requirement: 列布局响应式
看板列 SHALL 使用响应式宽度（`flex-1 min-w-[280px] basis-0`），替代固定 `w-80`（320px）。

- 三列在任意屏幕宽度下均分可用空间
- 单列最小宽度 280px 保证可用性
- 小屏时保留 `overflow-x-auto` 水平滚动作为兜底

#### Scenario: 宽屏下三列均分空间
- **WHEN** 用户在 1920px 宽度屏幕上打开看板
- **THEN** 三列等宽且填满可用水平空间（不再有右侧大量空白）

#### Scenario: 小屏下保留滚动
- **WHEN** 视口宽度不足以并排三列（< 840px）
- **THEN** 看板容器保留水平滚动能力

### Requirement: 条件 class 拼接使用 cn() 工具
组件中涉及条件 class 拼接的场景 SHALL 使用 `@/core/lib/utils` 中的 `cn()` 工具（基于 `clsx` + `tailwind-merge`），与应用其余模块保持一致。

#### Scenario: 拖拽悬停高亮使用 cn() 拼接
- **WHEN** 用户拖拽任务卡片到目标列上方
- **THEN** 目标列的 class 使用 `cn()` 拼接基础样式和拖拽高亮样式

### Requirement: 看板卡片操作按钮常驻可见
TaskCard 的编辑/删除按钮 SHALL 常驻可见，不得仅在 hover 时显示（触摸设备无 hover 状态）。

- 移除 `opacity-0 group-hover:opacity-100` 显隐机制
- 按钮样式保持 `Button variant="ghost" size="sm"`

#### Scenario: 触摸设备操作任务卡片
- **WHEN** 用户在触摸设备（无 hover）上查看任务卡片
- **THEN** 编辑与删除按钮直接可见、可点击

### Requirement: 看板卡片状态切换
TaskCard SHALL 提供状态下拉控件（shadcn Select，与列表视图 TaskRow 同款），使非拖拽用户（触摸/键盘）也能改变任务列。

- 切换为 DONE 时 SHALL 触发宠物联动事件（与列表视图/拖拽路径一致）

#### Scenario: 触摸设备改变任务状态
- **WHEN** 用户在触摸设备上点开卡片的"状态"下拉并选择"已完成"
- **THEN** 任务移入 DONE 列，宠物联动事件触发

### Requirement: 删除确认与撤销
任务删除 SHALL 不使用原生 `window.confirm`；删除成功 SHALL 弹出 sonner toast 并提供"撤销"action，撤销 SHALL 重新创建任务（复用 createTask）并恢复到原列（复用 moveTask）。

- 适用范围：TaskCard（看板）与 TaskRow（列表）两处删除入口

#### Scenario: 删除任务出现撤销提示
- **WHEN** 用户点击删除并确认
- **THEN** 任务立即删除，出现 toast 提示且带"撤销"按钮（无原生 confirm 弹窗）

#### Scenario: 撤销恢复任务
- **WHEN** 用户在删除 toast 中点击"撤销"
- **THEN** 任务按原内容（标题/描述/优先级/截止日期/标签）重新创建，并恢复到删除前的列

### Requirement: 同列拖拽保持原位
任务拖拽到其当前所在列 SHALL 不改变 sortOrder（不甩到列尾）；仅跨列拖拽时计算新列 max(sortOrder)+1。

#### Scenario: 同列拖拽不改变顺序
- **WHEN** 用户将任务卡片拖回其当前所在列
- **THEN** 任务保持原位置，不移动到列尾

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 看板视图列标题渲染（含 SVG 图标） | `todo-crud.spec.ts` | `看板页面使用 lucide 图标渲染列标题` | ✅ |
| 视图切换按钮（含 SVG 图标） | `todo-crud.spec.ts` | `视图切换` | ✅ |
| TaskForm 使用 Dialog 组件 | `todo-board-interaction.spec.ts` | `Dialog 关闭按钮可用` | ✅ |
| TaskCard 使用 Button 组件 | `todo-board-interaction.spec.ts` | `HTML5 拖拽任务换列` | ✅ |
| 主题切换时颜色跟随 | `todo-board-interaction.spec.ts` | `看板列颜色跟随主题切换` | ✅ |
| 宽屏下三列均分 | `todo-board-interaction.spec.ts` | `看板响应式列宽` | ✅ |
| 小屏下保留滚动 | `todo-board-interaction.spec.ts` | `看板响应式列宽` | ✅ |
