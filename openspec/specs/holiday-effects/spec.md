# Holiday Effects（节日特效层）

## Purpose
根据当前节日 `effectType` 自动激活对应视觉特效组件（烟花/雪花/花瓣/灯笼）。支持强度分级（off/low/full），移动端自动降级，`prefers-reduced-motion` 响应。

## Requirements

### Requirement: 根据节日自动激活对应特效
系统 SHALL 根据当前节日 `HolidayTheme.effectType` 的值，自动渲染对应的视觉特效组件。`effectType` 与特效组件映射：`firework` → `FireworkEffect`、`snow` → `SnowfallEffect`、`petal` → `PetalFallEffect`、`lantern` → `LanternFallEffect`、`none` → 不渲染。

#### Scenario: 春节激活烟花特效
- **WHEN** 当前节日为春节（`effectType = 'firework'`），且 `effectIntensity !== 'off'`
- **THEN** `FireworkEffect` 组件在页面背景渲染烟花粒子动画

#### Scenario: 圣诞节激活雪花特效
- **WHEN** 当前节日为圣诞节（`effectType = 'snow'`），且 `effectIntensity !== 'off'`
- **THEN** `SnowfallEffect` 组件在页面渲染 CSS 雪花飘落

#### Scenario: 用户关闭特效时不渲染
- **WHEN** 用户 `effectIntensity = 'off'`
- **THEN** 即使当前节日有 `effectType`，也不渲染特效组件

### Requirement: 特效强度分级
系统 SHALL 根据 `settingsStore.effectIntensity` 控制特效粒子密度：`low` 为低密度、`full` 为全密度。

#### Scenario: low 模式减少粒子
- **WHEN** `effectIntensity = 'low'`
- **THEN** 烟花粒子数减少至 ~15 个，雪花/花瓣数量减半

#### Scenario: full 模式满粒子
- **WHEN** `effectIntensity = 'full'`
- **THEN** 烟花粒子 ~60 个，雪花/花瓣满密度

### Requirement: 特效性能保护
系统 SHALL 在以下情况自动禁用特效：(a) 移动设备（`window.innerWidth < 768`），(b) 用户启用 `prefers-reduced-motion`，(c) `effectIntensity = 'off'`。

#### Scenario: 移动端自动降级
- **WHEN** 设备屏幕宽度 < 768px
- **THEN** 特效强度自动降级为 `low`

### Requirement: 特效渲染在 EffectLayer 中统一管理
所有特效组件 SHALL 在 `EffectLayer` 容器中渲染，`pointer-events: none`，不影响用户交互。

#### Scenario: 特效不阻挡交互
- **WHEN** 特效组件正在渲染
- **THEN** 页面按钮、输入框等交互元素仍可正常点击
