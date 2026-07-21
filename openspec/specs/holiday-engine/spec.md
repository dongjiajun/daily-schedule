# Holiday Engine（节日引擎入口）

## Purpose
汇聚四层节日数据（固定公历、浮动公历、农历、地区性）的统一查询引擎。提供 `getHolidays()` 返回当日活跃节日列表和 `getActiveTheme()` 返回当日最高优先级主题。全局单例模式，内部无状态。

## Requirements

### Requirement: 统一查询接口
`HolidayEngine.getHolidays(date, options?)` SHALL 汇聚四层节日数据，返回当日所有活跃节日，按优先级降序排列，并注入主题映射。

#### Scenario: 春节当天返回多源节日
- **WHEN** `getHolidays(new Date(2026, 1, 17), { locale: 'CN' })`（2026-02-17，春节）
- **THEN** 返回数组首位为春节（priority=100），theme 已注入（primaryColor="#E63946" 等）

#### Scenario: 普通日期无节日
- **WHEN** `getHolidays(new Date(2026, 6, 15))`（2026-07-15，无任何节日）
- **THEN** 返回空数组 `[]`

#### Scenario: 多节同日按优先级排序
- **WHEN** 同日同时有元旦（priority=75）和某国际节日（priority=60）
- **THEN** 返回数组首位为元旦（> 优先级在前）

### Requirement: 获取当前活跃主题
`HolidayEngine.getActiveTheme(date, options?)` SHALL 返回当日最高优先级节日的主题配置；无节日时返回 null。

#### Scenario: 春节返回春节主题
- **WHEN** 春节期间调用 `getActiveTheme(date, { locale: 'CN' })`
- **THEN** 返回 `{ primaryColor: "#E63946", effectType: "firework", … }`

#### Scenario: 无节日返回 null
- **WHEN** 非节日日期调用 `getActiveTheme(date)`
- **THEN** 返回 `null`

### Requirement: 节日主题映射完整性
所有 `Holiday.id`（来自四层数据）SHALL 在 `themeMapping.ts` 中有对应的 `HolidayTheme` 条目；缺失的节日返回 fallback 主题而非 undefined。

#### Scenario: 已知节日 id 有主题
- **WHEN** 查询任何已有节日（如 christmas, spring-festival, halloween）
- **THEN** `getThemeForHoliday(id)` 返回非 null 的 HolidayTheme

#### Scenario: 未知 id fallback
- **WHEN** 查询不存在的节日 id
- **THEN** 返回 `{ primaryColor: "#3b82f6", effectType: "none", intensity: "subtle" }`（默认 fallback）

### Requirement: 引擎单例模式
`HolidayEngine` SHALL 导出全局单例 `holidayEngine`，内部无状态，所有方法为纯函数。

#### Scenario: 单例引用一致
- **WHEN** `import { holidayEngine } from '@/holiday'` 两次
- **THEN** 两次引用为同一实例
