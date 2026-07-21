# Holiday Theme Auto（节日主题自动切换）

## Purpose
在 `useTheme` hook 中集成 `HolidayEngine`，每日自动检测节日并应用对应 CSS 主题。支持 manual/auto 双模式，日缓存避免重复调用。

## Requirements

### Requirement: 每日自动检测节日并切换主题
系统 SHALL 在 `useTheme` hook 中每日调用 `holidayEngine.getActiveTheme(new Date(), { locale })`，若当日有活跃节日，自动将节日主题的 CSS 变量应用到 `document.documentElement.dataset.theme`，覆盖用户手动选择的主题。

#### Scenario: 春节自动切换红色主题
- **WHEN** 当前日期为农历正月初一（春节），且用户 `themeMode = 'auto'`
- **THEN** 主题切换为春节主题（`primaryColor=#E63946`, `secondaryColor=#FFD700`, `accentColor=#8B0000`），页面整体色调变为红金色

#### Scenario: 圣诞节自动切换红绿主题
- **WHEN** 当前日期为 12 月 25 日（圣诞节），且 `themeMode = 'auto'`
- **THEN** 主题切换为圣诞主题（`primaryColor=#C41E3A`, `secondaryColor=#2E8B57`, `accentColor=#FFFFFF`），effectType=snow 触发雪花特效

#### Scenario: 无节日时使用用户手动主题
- **WHEN** 当前日期无任何节日，且用户设置了手动主题（如 `nature`）
- **THEN** 使用用户选择的手动主题，不自动切换

#### Scenario: 用户设置为手动模式时节日不覆盖
- **WHEN** 用户 `themeMode = 'manual'`，即使当日有节日
- **THEN** 不自动切换主题，使用用户手动选择的主题

#### Scenario: 节日结束时恢复原主题
- **WHEN** 节日结束（次日不再匹配），且 `themeMode = 'auto'`
- **THEN** 恢复为用户手动选择的 fallback 主题或默认主题

### Requirement: 节日主题 CSS 变量注入
系统 SHALL 将 `HolidayTheme` 的 `primaryColor/secondaryColor/accentColor` 映射为 `data-theme="holiday-<id>"` 属性，对应的 CSS 变量写入 `core/styles/holiday-themes.css`。

#### Scenario: CSS 变量正确映射
- **WHEN** 春节主题激活
- **THEN** `data-theme="holiday-spring-festival"`，CSS 变量 `--color-primary`/`--color-accent`/`--color-bg` 等反映春节配色

### Requirement: locale 参数传递给引擎
系统 SHALL 从 `settingsStore.locale` 读取当前地区设置，传递给 `holidayEngine.getHolidays(date, { locale })`，以支持地区性节日的主题切换。

#### Scenario: 日本用户看到樱花季主题
- **WHEN** 用户 `locale = 'JP'`，当前日期为 3 月 27 日（樱花季）
- **THEN** 主题切换为樱花季主题（`primaryColor=#F8BBD0`, effectType=petal）
