# Fixed Solar Holidays（固定公历节日）

## Purpose
根据给定公历日期，从静态映射表中匹配并返回符合的固定日期节日列表。覆盖不少于 15 个国际公历节日，数据为编译时常量，运行时不修改。

## Requirements

### Requirement: 返回固定日期的公历节日
系统 SHALL 根据给定公历日期，从静态映射表中匹配并返回符合的节日列表。每条节日包含 id、name、priority、theme 等字段。

#### Scenario: 元旦匹配
- **WHEN** 输入 `Date(2026, 0, 1)`（2026-01-01）
- **THEN** 返回包含 `{ id: "new-year", name: "元旦", priority: 75 }` 的数组

#### Scenario: 圣诞节匹配
- **WHEN** 输入 `Date(2026, 11, 25)`（2026-12-25）
- **THEN** 返回包含 `{ id: "christmas", name: "圣诞节", priority: 90 }` 的数组

#### Scenario: 非节日日期返回空
- **WHEN** 输入 `Date(2026, 2, 22)`（2026-03-22，无任何公历节日）
- **THEN** 返回空数组 `[]`

#### Scenario: 同日多节
- **WHEN** 输入 `Date(2026, 9, 31)`（万圣节 + 可能其他节日同日）
- **THEN** 返回数组包含该日所有匹配节日（至少万圣节）

### Requirement: 覆盖不少于 15 个国际节日
固定公历节日表 SHALL 至少包含以下节日：元旦、情人节、妇女节、愚人节、地球日、世界读书日、劳动节、世界环境日、国际儿童节、国际和平日、万圣节前夕、万圣节、圣诞前夕、圣诞节、圣帕特里克节。

#### Scenario: 节日表完整性
- **WHEN** 遍历全年 365 天
- **THEN** 至少 15 个不同节日 id 被命中

### Requirement: 节日数据不可变
节日映射表 MUST 为编译时常量，运行时不修改。

#### Scenario: import 多次返回同一引用
- **WHEN** 多次调用 `getFixedSolarHolidays()`
- **THEN** 行为一致，数据不变
