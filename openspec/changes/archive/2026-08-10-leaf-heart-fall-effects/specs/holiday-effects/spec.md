# Holiday Effects（节日特效层）

## Purpose
根据当前节日 `effectType` 自动激活对应视觉特效组件（烟花/雪花/花瓣/灯笼/落叶/爱心）。支持强度分级（off/low/full），移动端自动降级，`prefers-reduced-motion` 响应。

## MODIFIED Requirements

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

## Test Coverage
<!-- 回填：apply 阶段完成。特效类型解析来自共享包由 valentines/thanksgiving 渲染场景间接覆盖（若解析源缺失，场景断言必然失败）。 -->

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 春节激活烟花特效 | EffectLayer.test.tsx | 春节激活烟花特效 | ✅ |
| 圣诞节激活雪花特效 | EffectLayer.test.tsx | 圣诞节激活雪花特效 | ✅ |
| 用户关闭特效时不渲染 | EffectLayer.test.tsx | effectIntensity=off 时不渲染 | ✅ |
| 情人节激活爱心特效 | EffectLayer.test.tsx | 情人节激活爱心特效 | ✅ |
| 感恩节激活落叶特效 | EffectLayer.test.tsx | 感恩节激活落叶特效 | ✅ |
| 特效类型解析来自共享包唯一真相源 | EffectLayer.test.tsx | 情人节/感恩节激活场景（间接覆盖） | ✅ |
| 强度分级（low 20 / full 40） | LeafFallEffect.test.tsx / HeartFallEffect.test.tsx | low 模式渲染 20 片/颗、full 模式渲染 40 片/颗 | ✅ |
