# Floating Solar Holidays（浮动公历节日）

## ADDED Requirements

### Requirement: 感恩节计算
系统 SHALL 正确计算每年感恩节日期：美国感恩节为 11 月第 4 个周四。

#### Scenario: 2026 年感恩节
- **WHEN** 输入年份 2026
- **THEN** 返回 `{ id: "thanksgiving", date: Date(2026, 10, 26) }`（2026-11-26）

#### Scenario: 2024 年感恩节
- **WHEN** 输入年份 2024
- **THEN** 返回 `{ id: "thanksgiving", date: Date(2024, 10, 28) }`（2024-11-28）

#### Scenario: 感恩节日期匹配
- **WHEN** 输入 `Date(2026, 10, 26)`（感恩节当天）
- **THEN** 返回数组包含 `{ id: "thanksgiving" }`

### Requirement: 母亲节计算
系统 SHALL 正确计算每年母亲节日期：5 月第 2 个周日。

#### Scenario: 2026 年母亲节
- **WHEN** 输入年份 2026
- **THEN** 返回 `{ id: "mothers-day", date: Date(2026, 4, 10) }`（2026-05-10）

### Requirement: 父亲节计算
系统 SHALL 正确计算每年父亲节日期：6 月第 3 个周日。

#### Scenario: 2026 年父亲节
- **WHEN** 输入年份 2026
- **THEN** 返回 `{ id: "fathers-day", date: Date(2026, 5, 21) }`（2026-06-21）

### Requirement: 复活节计算（匿名算法）
系统 SHALL 使用匿名算法正确计算每年复活节日期（春分满月后第一个周日），覆盖 1900-2099 年。

#### Scenario: 2026 年复活节
- **WHEN** 输入年份 2026
- **THEN** 返回 `{ id: "easter", date: Date(2026, 3, 5) }`（2026-04-05）

#### Scenario: 2024 年复活节
- **WHEN** 输入年份 2024
- **THEN** 返回 `{ id: "easter", date: Date(2024, 2, 31) }`（2024-03-31）

#### Scenario: 2000 年复活节
- **WHEN** 输入年份 2000
- **THEN** 返回 `{ id: "easter", date: Date(2000, 3, 23) }`（2000-04-23）// 已知验证值

### Requirement: 浮动节日仅在当天匹配
每个浮动节日 SHALL 仅在其计算出的当天被匹配（无 range 扩展）。

#### Scenario: 感恩节前一天不匹配
- **WHEN** 输入 `Date(2026, 10, 25)`（感恩节前一天）
- **THEN** 返回数组不包含 `{ id: "thanksgiving" }`

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 2026 感恩节 | floatingSolar.test.ts | shouldGetThanksgiving2026 | ➕ |
| 2024 感恩节 | floatingSolar.test.ts | shouldGetThanksgiving2024 | ➕ |
| 母亲节 | floatingSolar.test.ts | shouldGetMothersDay | ➕ |
| 父亲节 | floatingSolar.test.ts | shouldGetFathersDay | ➕ |
| 2026 复活节 | floatingSolar.test.ts | shouldGetEaster2026 | ➕ |
| 2000 复活节 | floatingSolar.test.ts | shouldGetEaster2000 | ➕ |
| 前一天不匹配 | floatingSolar.test.ts | shouldNotMatchDayBefore | ➕ |
