# Settings Theme Extension（设置扩展）

## Purpose
扩展 `settingsStore` 以支持节日主题自动切换和特效控制。新增字段通过 localStorage 持久化，向后兼容旧版无字段的用户。

## Requirements

### Requirement: themeMode 字段
`settingsStore` SHALL 新增 `themeMode` 字段，类型为 `'manual' | 'auto'`，默认值为 `'manual'`。当值为 `'auto'` 时，系统根据日期自动切换节日主题。

#### Scenario: 默认 manual 模式
- **WHEN** 新用户首次使用系统
- **THEN** `themeMode = 'manual'`，主题由用户手动在设置面板中选择

#### Scenario: 切换到 auto 模式
- **WHEN** 用户在设置面板中选择"主题模式：自动"
- **THEN** `themeMode = 'auto'`，次日（或当日如有节日）自动应用节日主题

### Requirement: effectIntensity 字段
`settingsStore` SHALL 新增 `effectIntensity` 字段，类型为 `'off' | 'low' | 'full'`，默认值为 `'low'`（性能优先）。

#### Scenario: 默认 low 强度
- **WHEN** 新用户首次使用
- **THEN** `effectIntensity = 'low'`，特效以低粒子密度渲染

### Requirement: autoDarkMode 字段
`settingsStore` SHALL 新增 `autoDarkMode` 字段，类型为 `boolean`，默认值为 `false`。

#### Scenario: 默认关闭
- **WHEN** 新用户首次使用
- **THEN** `autoDarkMode = false`

### Requirement: 持久化兼容
新增字段 SHALL 写入 `localStorage` 的 `settings.v1` key，旧版本无这些字段时使用默认值（向后兼容）。

#### Scenario: 升级用户自动获得默认值
- **WHEN** 现有用户的 `settings.v1` 中没有 `themeMode`/`effectIntensity`/`autoDarkMode`
- **THEN** `settingsStore` 使用默认值（`manual`/`low`/`false`），不报错
