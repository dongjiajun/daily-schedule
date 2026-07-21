# Settings Theme Extension（设置扩展）

## ADDED Requirements

### Requirement: themeMode 字段
`settingsStore` SHALL 新增 `themeMode` 字段，类型为 `'manual' | 'auto'`，默认值为 `'manual'`（保持当前行为）。当值为 `'auto'` 时，系统根据日期自动切换节日主题。

#### Scenario: 默认 manual 模式
- **WHEN** 新用户首次使用系统
- **THEN** `themeMode = 'manual'`，主题由用户手动在设置面板中选择

#### Scenario: 切换到 auto 模式
- **WHEN** 用户在设置面板中选择"主题模式：自动"
- **THEN** `themeMode = 'auto'`，次日（或当日如有节日）自动应用节日主题

#### Scenario: auto 模式下用户仍可临时切换
- **WHEN** `themeMode = 'auto'`，用户手动选择了一个主题
- **THEN** 手动选择的主题立即生效，但在下一个节日匹配时被覆盖

### Requirement: effectIntensity 字段
`settingsStore` SHALL 新增 `effectIntensity` 字段，类型为 `'off' | 'low' | 'full'`，默认值为 `'low'`（性能优先）。

#### Scenario: 默认 low 强度
- **WHEN** 新用户首次使用
- **THEN** `effectIntensity = 'low'`，特效以低粒子密度渲染

#### Scenario: 用户关闭特效
- **WHEN** 用户在设置中选择"特效强度：关闭"
- **THEN** `effectIntensity = 'off'`，所有节日特效停止渲染

### Requirement: autoDarkMode 字段
`settingsStore` SHALL 新增 `autoDarkMode` 字段，类型为 `boolean`，默认值为 `false`。

#### Scenario: 启用自动暗黑模式
- **WHEN** `autoDarkMode = true`
- **THEN** 系统根据系统暗黑模式设置（`prefers-color-scheme: dark`）在节日主题基础上叠加暗色模式变体

#### Scenario: 默认关闭
- **WHEN** 新用户首次使用
- **THEN** `autoDarkMode = false`

### Requirement: 持久化兼容
新增字段 SHALL 写入 `localStorage` 的 `settings.v1` key，旧版本无这些字段时使用默认值（向后兼容）。

#### Scenario: 升级用户自动获得默认值
- **WHEN** 现有用户的 `settings.v1` 中没有 `themeMode`/`effectIntensity`/`autoDarkMode`
- **THEN** `settingsStore` 使用默认值（`manual`/`low`/`false`），不报错

#### Scenario: 新字段正确存取
- **WHEN** 用户修改 `effectIntensity = 'full'`
- **THEN** `localStorage.setItem('settings.v1', ...)` 包含 `effectIntensity: 'full'`，刷新后保持

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 默认 manual | settingsStore.test.ts | shouldDefaultToManualThemeMode | ➕ |
| 默认 low 强度 | settingsStore.test.ts | shouldDefaultToLowIntensity | ➕ |
| 默认 autoDark=false | settingsStore.test.ts | shouldDefaultAutoDarkFalse | ➕ |
| auto 模式切换 | settingsStore.test.ts | shouldSwitchToAutoThemeMode | ➕ |
| 持久化读写 | settingsStore.test.ts | shouldPersistNewFields | ➕ |
| 向后兼容 | settingsStore.test.ts | shouldBackwardCompatMissingFields | ➕ |
