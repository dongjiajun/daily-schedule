# Task Kanban Delta Specification

## MODIFIED Requirements

### Requirement: 组件体系对齐 shadcn/ui
看板中所有交互元素 SHALL 使用已有的 shadcn/ui 与设计系统原语，而非原生 HTML 控件或手写硬边色块：`TaskForm` SHALL 使用 `Dialog`、`Label`、`Input`、`Textarea` 与 `Select`；`TaskColumn` 内联新建 SHALL 使用 `Input`；`TaskCard` 与 `TaskRow` 操作按钮及状态切换 SHALL 使用 `Button` 与 `Select`；优先级标识 SHALL 使用 `<Badge>` 语义标签。

#### Scenario: TaskForm 弹窗使用 Dialog 组件
- **WHEN** 用户点击"新建任务"或"编辑"
- **THEN** 弹出框使用 shadcn/ui Dialog（含 backdrop-blur 遮罩、rounded-2xl 圆角、animate-in 入场动画、X 关闭按钮）

#### Scenario: TaskForm 表单字段使用设计系统原语
- **WHEN** 用户打开新建或编辑任务表单填写标题、描述、优先级与截止日期
- **THEN** 表单使用设计系统 `Label`、`Input`、`Textarea` 与 Radix `Select` 下拉选择优先级，不再出现原生 `<select>` 与无焦点环输入框

#### Scenario: TaskCard 操作按钮使用 Button 组件
- **WHEN** 用户查看任务卡片
- **THEN** 直接显示 shadcn/ui Button（variant="ghost" size="sm"）的编辑和删除按钮（常驻可见）

#### Scenario: TaskCard 状态切换使用 Select 组件
- **WHEN** 用户查看任务卡片
- **THEN** 卡片显示 shadcn/ui Select 状态下拉（触发项含当前状态图标与文字）

## ADDED Requirements

### Requirement: 看板卡片悬停抬升与拖拽源反馈

看板任务卡片悬停时 SHALL 从 `shadow-card` 过渡到 `shadow-float` 并呈现轻量微抬升；HTML5 拖拽进行中 SHALL 为原卡片应用半透明微缩反馈并在拖拽结束或取消时恢复原态；列头图标 SHALL 使用与列状态一致的语义着色。

#### Scenario: 悬停与拖拽源视觉反馈

- **WHEN** 鼠标悬停在任务卡片上或用户开始拖拽卡片跨列移动
- **THEN** 悬停态阴影抬升至 `shadow-float`，拖拽期间原卡片显示降透明微缩状态，目标列呈现虚线主题高亮

#### Scenario: 拖拽取消或结束后卡片恢复常态

- **WHEN** 用户将拖拽中的卡片释放到原列或按 Esc 取消拖拽
- **THEN** 原卡片立即清除拖拽半透明状态并恢复 `opacity-100` 与正常尺寸，不触发多余变更请求
