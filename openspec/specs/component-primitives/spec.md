# component-primitives Specification

## Purpose
定义前端组件原语层的语义与可访问性契约，让业务组件通过 Card / Badge / Segmented / EmptyState / Skeleton / Tooltip / Kbd / Progress 表达常见 UI 结构，而不是各自手写样式。

## Requirements

### Requirement: 原语仅用设计 token 表达样式

组件原语 SHALL 仅使用契约 token（颜色、圆角、阴影、动效、密度）表达样式，SHALL NOT 内含裸色值或裸几何值；原语的默认状态 SHALL 无需调用方补丁即可使用。

#### Scenario: 新增原语仅引用 token

- **WHEN** 开发者新增一个原语并使用 `bg-surface`、`rounded-lg`、`shadow-card`、`duration-base`
- **THEN** `pnpm run ui:check` 通过，且组件在 5 套主题下颜色正确

#### Scenario: 原语写死几何值

- **WHEN** 原语内出现 `rounded-[10px]` 或 `shadow-[0_2px_8px]` 等契约外的裸值
- **THEN** `ui:check` 输出文件与行号并非零退出

### Requirement: 原语可访问性基线

交互原语 SHALL 满足可访问性基线：Tooltip SHALL 支持悬停与键盘聚焦触发并通过 `aria-describedby` 关联目标；Segmented SHALL 使用 `radiogroup`/`aria-checked` 语义并支持方向键切换；Kbd SHALL 使用 `<kbd>` 语义；全部交互原语 SHALL 具备可见焦点环。

#### Scenario: 键盘聚焦显示 tooltip

- **WHEN** 用户用 Tab 聚焦到带 Tooltip 的按钮
- **THEN** tooltip 文本出现，且目标元素通过 `aria-describedby` 指向该文本

#### Scenario: Segmented 方向键切换

- **WHEN** 用户在 Segmented 上按左右方向键
- **THEN** 选中项按顺序移动，`aria-checked` 与视觉状态同步更新

### Requirement: 状态原语表达加载与空态

EmptyState SHALL 同时提供标题、说明与可选操作入口；Skeleton SHALL 以 `aria-hidden` 标记装饰性并保持与目标内容一致的占位尺寸；加载态 SHALL NOT 以裸文本作为唯一反馈。

#### Scenario: 加载中显示骨架

- **WHEN** 看板或日历数据加载中
- **THEN** 渲染与最终布局同尺寸的 Skeleton，屏幕阅读器不朗读占位块

#### Scenario: 空列表显示空态

- **WHEN** 列表无数据
- **THEN** 显示 EmptyState（标题 + 说明 + 可选操作），而不是空白区域

### Requirement: 原语密度适配

原语 SHALL 通过 `data-density` 驱动的密度 token（控件高度 / 内边距 / 行高）适配 comfortable 与 compact 两种密度，SHALL NOT 在组件内写死像素尺寸。

#### Scenario: 默认密度

- **WHEN** 用户未修改密度设置
- **THEN** 控件使用 comfortable 高度与内边距，界面与当前观感一致

#### Scenario: 切换紧凑密度

- **WHEN** 用户在偏好设置中切换为 compact
- **THEN** 控件高度、卡片内边距与列表行高同步变小，且不影响可点击区域可达性

### Requirement: 核心交互原语触感与微动效反馈

`Segmented` SHALL 在激活项背后渲染弹性滑动指示底片，并保持 `radiogroup`/`aria-checked` 语义与密度高度契约（comfortable `md` 32px / compact `md` 28px）；`Button` SHALL 仅使用契约阴影 `shadow-card` 并具备轻按微回弹反馈；`DialogContent` SHALL 具备 `border-border` 语义细边框；全局 `MotionConfig` 与 CSS 媒体查询 SHALL 确保减弱动态偏好下动画瞬时降级。

#### Scenario: 分段控件切换视图呈现平滑滑动底片

- **WHEN** 用户在日历顶栏或待办顶栏点击 `Segmented` 选项（或使用方向键切换）
- **THEN** 选中项高亮底片平滑过渡到目标选项，`aria-checked` 状态同步更新，且控件计算高度与当前密度匹配

#### Scenario: 减弱动态偏好下按压与切换降级

- **WHEN** 系统开启 `prefers-reduced-motion: reduce` 后用户点击 `Button` 或切换 `Segmented`
- **THEN** 弹性位移与过渡自动压缩至近乎瞬时完成，控件焦点环与可点击区域不受影响
