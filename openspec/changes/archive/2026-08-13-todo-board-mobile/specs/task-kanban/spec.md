# Task Kanban

> 参考: specs/openapi.yaml + docs/api/overview.md + docs/database/schema.md

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

无

## RENAMED Requirements

无
