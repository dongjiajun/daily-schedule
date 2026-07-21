# Lunar Holidays（农历节日）

## Purpose
使用 `lunar-typescript` 库进行公历↔农历换算，支持中国的 7 个传统农历节日（春节、元宵、端午、中秋、七夕、重阳、清明），含节日 range 逻辑。

## Requirements

### Requirement: 春节计算
系统 SHALL 使用 `lunar-typescript` 库换算农历正月初一对应的公历日期，并覆盖正月初一至初七（7 天范围）。

#### Scenario: 2026 年春节
- **WHEN** 输入 `Date(2026, 1, 17)`（2026-02-17，农历正月初一）
- **THEN** 返回包含 `{ id: "spring-festival", name: "春节", priority: 100, dateRange: ["2026-02-17", "2026-02-23"] }` 的数组

#### Scenario: 春节范围内（初三）
- **WHEN** 输入 `Date(2026, 1, 19)`（2026-02-19，农历正月初三）
- **THEN** 返回数组包含春节（在 range 内）

#### Scenario: 春节范围外
- **WHEN** 输入 `Date(2026, 1, 25)`（2026-02-25，农历正月初九）
- **THEN** 返回数组不包含春节

### Requirement: 中秋节计算
系统 SHALL 换算农历八月十五对应的公历日期，覆盖前后各 1 天（3 天范围）。

#### Scenario: 2026 年中秋
- **WHEN** 输入 `Date(2026, 8, 25)`（2026-09-25，农历八月十五）
- **THEN** 返回包含 `{ id: "mid-autumn", name: "中秋节", priority: 85 }` 的数组

### Requirement: 端午节计算
系统 SHALL 换算农历五月初五，覆盖 3 天范围。

#### Scenario: 2026 年端午
- **WHEN** 输入农历五月初五对应的公历日期
- **THEN** 返回包含 `{ id: "dragon-boat", name: "端午节" }` 的数组

### Requirement: 其他农历节日
系统 SHALL 支持以下农历节日：元宵节（正月十五）、七夕（七月初七）、重阳节（九月初九）、清明节（四月初五）。

#### Scenario: 元宵节
- **WHEN** 输入农历正月十五对应的公历日期
- **THEN** 返回 `{ id: "lantern-festival", name: "元宵节" }`

#### Scenario: 清明节
- **WHEN** 输入农历四月初五对应的公历日期
- **THEN** 返回 `{ id: "qingming", name: "清明节" }`

### Requirement: 非农历节日日期空返回
- **WHEN** 输入某公历日期，当天没有任何农历节日（含 range）
- **THEN** 返回空数组 `[]`
