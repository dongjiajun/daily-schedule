# Regional Holidays（地区性节日）

## ADDED Requirements

### Requirement: 按 locale 过滤地区性节日
系统 SHALL 根据传入的 locale 参数，返回对应地区特有的节日。若未传入 locale，则不返回任何地区性节日。

#### Scenario: locale=IN 返回排灯节
- **WHEN** 输入排灯节日期 + `locale: "IN"`
- **THEN** 返回包含 `{ id: "diwali", name: "排灯节", locale: ["IN"] }` 的数组

#### Scenario: locale 不匹配不返回
- **WHEN** 输入排灯节日期 + `locale: "CN"`
- **THEN** 返回数组不包含排灯节

#### Scenario: 无 locale 参数
- **WHEN** `getRegionalHolidays(date)` 不传 locale
- **THEN** 返回空数组 `[]`

### Requirement: 支持多个 locale 值
单条地区性节日 SHALL 可关联多个 locale。

#### Scenario: 樱花季匹配 JP 和 KR
- **WHEN** 输入樱花季日期 + `locale: "JP"` 或 `locale: "KR"`
- **THEN** 返回包含 `{ id: "sakura", name: "樱花季" }`

### Requirement: 覆盖不少于 5 个地区性节日
地区性节日表 SHALL 至少包含：排灯节（IN）、亡灵节（MX）、樱花季（JP/KR）、啤酒节（DE）、狂欢节（BR）。

#### Scenario: 节日表完整性
- **WHEN** 遍历所有 locale 枚举值
- **THEN** 至少 5 个不同节日 id 被覆盖

### Requirement: 地区性节日数据可扩展
地区性节日表 SHALL 设计为可扩展结构（数组 + locale 字段），新增地区节日只需加一条记录。

#### Scenario: 扩展新节日
- **WHEN** 在数组中新增 `{ locale: ['FR'], month: 7, day: 14, id: 'bastille-day', … }`
- **THEN** `getRegionalHolidays(date, { locale: 'FR' })` 应返回法国国庆日

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 排灯节 IN | regional.test.ts | shouldReturnDiwaliForIN | ➕ |
| locale 不匹配 | regional.test.ts | shouldFilterByLocale | ➕ |
| 无 locale 空返回 | regional.test.ts | shouldReturnEmptyWithoutLocale | ➕ |
| 樱花季多 locale | regional.test.ts | shouldMatchMultiLocale | ➕ |
| 完整性 5+ | regional.test.ts | shouldCoverAtLeast5Holidays | ➕ |
