# Holiday Effects（节日特效层）

## Purpose
根据当前节日 `effectType` 自动激活对应视觉特效组件（烟花/雪花/花瓣/灯笼）。支持强度分级（off/low/full），移动端自动降级，`prefers-reduced-motion` 响应。

## Requirements

### Requirement: 根据节日自动激活对应特效
系统 SHALL 根据当前节日 `HolidayTheme.effectType` 的值，自动渲染对应的视觉特效组件。`effectType` 与特效组件映射：`firework` → `FireworkEffect`、`snow` → `SnowfallEffect`、`petal` → `PetalFallEffect`、`lantern` → `LanternFallEffect`、`leaf` → `LeafFallEffect`、`heart` → `HeartFallEffect`、`none` → 不渲染。`effectType` 解析 SHALL 消费共享包 `getThemeForHoliday(holidayId).effectType`（`packages/shared/src/holiday/themeMapping.ts` 为唯一真相源），不得在 `EffectLayer` 维护独立映射副本。

#### Scenario: 春节激活烟花特效
- **WHEN** 当前节日为春节（`effectType = 'firework'`），且 `effectIntensity !== 'off'`
- **THEN** `FireworkEffect` 组件在页面背景渲染烟花粒子动画

#### Scenario: 圣诞节激活雪花特效
- **WHEN** 当前节日为圣诞节（`effectType = 'snow'`），且 `effectIntensity !== 'off'`
- **THEN** `SnowfallEffect` 组件在页面渲染 CSS 雪花飘落

#### Scenario: 情人节激活爱心特效
- **WHEN** 当前节日为情人节（`effectType = 'heart'`），且 `effectIntensity !== 'off'`
- **THEN** `HeartFallEffect` 组件在页面渲染 CSS 爱心飘落

#### Scenario: 感恩节激活落叶特效
- **WHEN** 当前节日为感恩节（`effectType = 'leaf'`），且 `effectIntensity !== 'off'`
- **THEN** `LeafFallEffect` 组件在页面渲染 CSS 落叶飘落

#### Scenario: 特效类型解析来自共享包唯一真相源
- **WHEN** 当前节日为任意已配置节日的 `theme.effectType`
- **THEN** `EffectLayer` 通过 `getThemeForHoliday(activeHolidayId).effectType` 解析特效类型，与 `THEME_MAP` 声明一致，无本地硬编码映射

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

### Requirement: 重型粒子特效按需懒加载

`EffectLayer` 中的 `FireworkEffect` 与 `LanternFallEffect` SHALL 通过 `React.lazy()` 按需异步加载，并由 `Suspense fallback={null}` 与局部静默错误边界包裹；纯 CSS 特效（雪花、花瓣、落叶、爱心）保持同步渲染，常规工作日与未启用粒子节日不请求 `tsparticles` 脚本。

#### Scenario: 常规或纯 CSS 特效日不加载粒子引擎

- **WHEN** `activeHolidayId` 为空、`effectIntensity = 'off'`、`prefers-reduced-motion: reduce` 或节日仅使用纯 CSS 特效（雪花/花瓣/落叶/爱心）
- **THEN** 系统 SHALL NOT 触发 `FireworkEffect`、`LanternFallEffect` 或 `@tsparticles` 分片加载

#### Scenario: 粒子节日异步挂载并在分片失败时静默降级

- **WHEN** 当前节日激活 `firework`（春节）或 `lantern`（中秋/元宵等）且未触发性能关闭条件
- **THEN** `EffectLayer` SHALL 异步加载并渲染 `firework-particles` 或 `lantern-particles`，且保持 `pointer-events: none`
- **WHEN** 粒子特效异步分片加载或渲染失败抛出异常
- **THEN** `EffectLayer` 局部静默错误边界 SHALL 捕获异常并静默降级（不崩溃主页面、不阻断交互），并在节日切换重置后允许恢复
