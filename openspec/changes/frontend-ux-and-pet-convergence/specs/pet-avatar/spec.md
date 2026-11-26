# Pet Avatar（宠物形象展示）

## ADDED Requirements

### Requirement: SVG 视图框单次缩放无双重放大
`OrangeCat` 与 `ShibaInu` SVG 插画 SHALL 仅通过 `width={size}`、`height={size}` 与 `viewBox="0 0 100 100"` 控制展示尺寸，不得再叠加 `transform: scale(size / 100)` 内联缩放，确保任意尺寸下渲染边界与 `AccessoryOverlay` 完全一致。

#### Scenario: 大尺寸与小尺寸精确渲染且配饰对齐
- **WHEN** `SvgAvatar` 分别以 `size={200}` 与 `size={40}` 渲染 `ORANGE_CAT` 或 `SHIBA_INU`
- **THEN** 根 `<svg>` 的 `width`/`height` 等于传入 `size`、无 `transform: scale(...)` 内联样式，且与 `AccessoryOverlay` 同尺寸重合对齐

#### Scenario: 非默认尺寸无溢出或缩水
- **WHEN** 在 `/pet` 专页以 `size={200}` 或在侧边栏以 `size={40}` 渲染宠物形象
- **THEN** 视觉占用严格等于 `size × size` 像素容器，不出现 400px 溢出遮挡按钮或 16px 异常缩水
