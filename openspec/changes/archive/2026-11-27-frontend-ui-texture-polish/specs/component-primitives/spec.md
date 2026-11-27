# component-primitives Delta Specification

## ADDED Requirements

### Requirement: 核心交互原语触感与微动效反馈

`Segmented` SHALL 在激活项背后渲染弹性滑动指示底片，并保持 `radiogroup`/`aria-checked` 语义与密度高度契约（comfortable `md` 32px / compact `md` 28px）；`Button` SHALL 仅使用契约阴影 `shadow-card` 并具备轻按微回弹反馈；`DialogContent` SHALL 具备 `border-border` 语义细边框；全局 `MotionConfig` 与 CSS 媒体查询 SHALL 确保减弱动态偏好下动画瞬时降级。

#### Scenario: 分段控件切换视图呈现平滑滑动底片

- **WHEN** 用户在日历顶栏或待办顶栏点击 `Segmented` 选项（或使用方向键切换）
- **THEN** 选中项高亮底片平滑过渡到目标选项，`aria-checked` 状态同步更新，且控件计算高度与当前密度匹配

#### Scenario: 减弱动态偏好下按压与切换降级

- **WHEN** 系统开启 `prefers-reduced-motion: reduce` 后用户点击 `Button` 或切换 `Segmented`
- **THEN** 弹性位移与过渡自动压缩至近乎瞬时完成，控件焦点环与可点击区域不受影响
