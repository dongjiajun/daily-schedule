# Design: 国际节日引擎 (Holiday Engine)

## Context
当前 `packages/shared/` 仅包含 EventBus、类型定义和常量，无时间/节日相关逻辑。前端 5 套主题通过 settingsStore 手动切换，无时间感知。节日引擎是 M1.4（节日主题自动切换 + 特效）的底层依赖，负责回答核心问题："今天是什么节日？应该展示什么主题？"

**约束**:
- 必须支持农历换算（春节、中秋等），依赖 `lunar-typescript`
- 必须可被 Web（Vite）和小程序（Taro）双端引用（纯 TypeScript，无 DOM 依赖）
- 不依赖任何后端 API——离线可用
- 节日数据在 `packages/shared/src/holiday/` 中硬编码

## Goals / Non-Goals

**Goals:**
- 给定任意 `Date`，返回当日活跃节日列表（可能 0~N 个）
- 覆盖四层节日：固定公历 / 浮动公历 / 农历 / 地区性
- 提供节日→主题+特效映射（供 M1.4 消费）
- 节日优先级排序（同时多个节日时，取最高优先级）
- 测试覆盖关键日期（春节、圣诞、感恩节、复活节等）

**Non-Goals:**
- 节气（24 节气，不包括 v1）
- 节日详情（如由来、习俗——v1 只提供名称+主题+特效类型）
- 后端持久化或动态配置
- 用户自定义节日
- 多语言（节日名称 v1 仅中文）

## Decisions

### Decision 1: 节日数据四层架构
- **选择**: 按计算复杂度分层
  ```
  Layer 1 (固定公历): { month, day } 静态映射 — 元旦、圣诞、万圣节…
  Layer 2 (浮动公历): 算法函数 — 感恩节、母亲节、复活节…
  Layer 3 (农历): lunar-typescript 换算 → 转公历日期范围
  Layer 4 (地区性): Layer 1-3 + locale tag 过滤
  ```
- **理由**: 分层后各层独立测试、独立扩展，不会互相污染
- **备选方案**: 单一大 JSON——无法处理浮动节日和农历，农历日期每年不同

### Decision 2: 农历依赖选型 — `lunar-typescript`
- **选择**: `lunar-typescript`（npm 包）
- **理由**: 纯 TypeScript、无原生依赖、支持 1900-2100 年、API 简洁（`Solar.fromDate(date).getLunar()`）、维护活跃
- **备选方案**:
  - `lunar-javascript` — 同源仓库，旧版 API，不推荐
  - `chinese-lunar-calendar` — 年久失修
  - 自建农历算法 — 错误率高，维护成本巨大

### Decision 3: 引擎返回集合而非单个节日
- **选择**: `getHolidays(date)` 返回 `Holiday[]`（可能空数组），优先级高者先
- **理由**: 同一天可能多节重叠（如圣诞节 + 元旦前夕），M1.4 消费者自行决定取优先级最高或全部展示
- **备选方案**: 只返回"最重要的节日"——丢失信息，特效叠加场景无法支持

### Decision 4: 复活节算法
- **选择**: 匿名算法（Anonymous Gregorian algorithm / Meeus/Jones/Butcher 算法）
- **理由**: 复活节 = 春分满月后第一个周日，无简单公式；匿名算法正确覆盖 1900-2099，业界标准
- **备选方案**: 预计算未来 N 年并硬编码——维护负担，每 N 年需更新

## 模块架构

```
packages/shared/src/holiday/
├── index.ts              # 统一导出
├── types.ts              # 类型定义
├── fixedSolar.ts         # Layer 1: 固定公历节日
├── floatingSolar.ts      # Layer 2: 浮动公历节日
├── lunar.ts              # Layer 3: 农历节日
├── regional.ts           # Layer 4: 地区性节日
├── engine.ts             # HolidayEngine: 汇聚四层
├── themeMapping.ts       # 节日 → 主题 + 特效映射
└── __tests__/
    ├── fixedSolar.test.ts
    ├── floatingSolar.test.ts
    ├── lunar.test.ts
    ├── engine.test.ts
    └── themeMapping.test.ts
```

### 类型设计 (`types.ts`)

```typescript
export interface Holiday {
  id: string                    // 唯一标识，如 "spring-festival"
  name: string                  // 中文名称，如 "春节"
  englishName: string           // 英文名称，如 "Spring Festival"
  layer: HolidayLayer           // FIXED_SOLAR | FLOATING_SOLAR | LUNAR | REGIONAL
  category: HolidayCategory     // TRADITIONAL | RELIGIOUS | SECULAR | REGIONAL
  priority: number              // 1-100，同一天多个节日时排序
  dateRange: [string, string]   // ISO date 区间，如 ["2026-02-17", "2026-02-17"]
  locale?: string[]             // 关联地区，如 ["CN","TW","SG"]
  theme: HolidayTheme           // 主题映射（由 engine 注入）
}

// 由于 erasableSyntaxOnly，使用 const object + type alias 替代 runtime enum
export const HolidayLayer = {
  FIXED_SOLAR: 'FIXED_SOLAR',
  FLOATING_SOLAR: 'FLOATING_SOLAR',
  LUNAR: 'LUNAR',
  REGIONAL: 'REGIONAL',
} as const
export type HolidayLayer = (typeof HolidayLayer)[keyof typeof HolidayLayer]

export type HolidayCategory = 'TRADITIONAL' | 'RELIGIOUS' | 'SECULAR' | 'REGIONAL'

export interface HolidayTheme {
  primaryColor: string          // 主色
  secondaryColor: string        // 辅色
  accentColor: string           // 强调色
  effectType: EffectType        // 特效类型
  intensity: 'subtle' | 'moderate' | 'festive'  // 特效强度
  petAccessory?: string         // 建议宠物装扮
}

export type EffectType = 'firework' | 'snow' | 'petal' | 'leaf' | 'lantern' | 'heart' | 'none'
```

### 各层实现要点

**Layer 1: `fixedSolar.ts`** — 静态映射表:
```typescript
const FIXED_SOLAR_HOLIDAYS: FixedSolarDef[] = [
  { month: 1, day: 1, id: 'new-year', name: '元旦', … },
  { month: 2, day: 14, id: 'valentines', name: '情人节', … },
  { month: 3, day: 17, id: 'st-patricks', name: '圣帕特里克节', … },
  { month: 10, day: 31, id: 'halloween', name: '万圣节', … },
  { month: 12, day: 25, id: 'christmas', name: '圣诞节', … },
  // 约 15-20 个节日
]
export function getFixedSolarHolidays(date: Date): Holiday[] { … }
```

**Layer 2: `floatingSolar.ts`** — 算法函数:
```typescript
// 感恩节: 11 月第 4 个周四
export function getThanksgiving(year: number): Holiday { … }
// 母亲节: 5 月第 2 个周日
export function getMothersDay(year: number): Holiday { … }
// 复活节: 匿名算法
export function getEaster(year: number): Holiday { … }
// 父亲节: 6 月第 3 个周日
export function getFathersDay(year: number): Holiday { … }
```

Easter algorithm (匿名算法):
```typescript
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}
```

**Layer 3: `lunar.ts`** — 依赖 `lunar-typescript`:
```typescript
import { Solar } from 'lunar-typescript'

// 配置: 农历节日定义 → { lunarMonth, lunarDay }
const LUNAR_HOLIDAYS = [
  { month: 1, day: 1, id: 'spring-festival', name: '春节', range: 7 },
  { month: 1, day: 15, id: 'lantern-festival', name: '元宵节', range: 1 },
  { month: 5, day: 5, id: 'dragon-boat', name: '端午节', range: 3 },
  { month: 8, day: 15, id: 'mid-autumn', name: '中秋节', range: 3 },
  { month: 7, day: 7, id: 'qixi', name: '七夕', range: 1 },
  { month: 9, day: 9, id: 'chongyang', name: '重阳节', range: 1 },
  { month: 4, day: 5, id: 'qingming', name: '清明节', range: 3 },
]

export function getLunarHolidays(date: Date): Holiday[] {
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  // 匹配当天 + range 范围内的节日
}
```

**Layer 4: `regional.ts`**:
```typescript
const REGIONAL_HOLIDAYS = [
  { locale: ['IN'], month: 10, day: 24, id: 'diwali', … },   // 排灯节（简化）
  { locale: ['MX'], month: 11, day: 2, id: 'dia-de-muertos', … }, // 亡灵节
  { locale: ['JP'], month: 3, day: 25, id: 'sakura', … },    // 樱花季
]

export function getRegionalHolidays(date: Date, locale?: string): Holiday[] { … }
```

### 引擎 (`engine.ts`)

```typescript
export class HolidayEngine {
  getHolidays(date: Date, options?: { locale?: string }): Holiday[] {
    const holidays = [
      ...getFixedSolarHolidays(date),
      ...getFloatingSolarHolidays(date),
      ...getLunarHolidays(date),
      ...getRegionalHolidays(date, options?.locale),
    ]
    // 注入主题映射
    holidays.forEach(h => { h.theme = getThemeForHoliday(h.id) })
    // 按优先级降序
    return holidays.sort((a, b) => b.priority - a.priority)
  }

  getActiveTheme(date: Date, options?: { locale?: string }): HolidayTheme | null {
    const holidays = this.getHolidays(date, options)
    return holidays.length > 0 ? holidays[0].theme : null
  }
}

// 全局单例
export const holidayEngine = new HolidayEngine()
```

### 主题映射 (`themeMapping.ts`)

```typescript
const THEME_MAP: Record<string, HolidayTheme> = {
  'spring-festival':   { primaryColor: '#E63946', secondaryColor: '#FFD700', accentColor: '#8B0000', effectType: 'firework', intensity: 'festive', petAccessory: '年兽皮肤' },
  'christmas':         { primaryColor: '#C41E3A', secondaryColor: '#2E8B57', accentColor: '#FFFFFF', effectType: 'snow', intensity: 'festive', petAccessory: '麋鹿角' },
  'halloween':         { primaryColor: '#FF6B00', secondaryColor: '#4B0082', accentColor: '#000000', effectType: 'lantern', intensity: 'moderate', petAccessory: '巫师帽' },
  'mid-autumn':        { primaryColor: '#D4A017', secondaryColor: '#1B1B5E', accentColor: '#F5E6C8', effectType: 'lantern', intensity: 'moderate', petAccessory: '玉兔皮肤' },
  // … 12+ 条目
}
```

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| `lunar-typescript` 不支持 2100 年后 | 当前年份 + 50 年足够；2100 年时迁移到新库 |
| 农历节日范围天数人工设定（春节 7 天、端午 3 天） | 范围是展示建议，非精确算法；M1.4 可覆写 |
| 排灯节等地区性节日用固定公历简化（实际随农历/伊斯兰历） | 标记 `simplified: true`，后续精确化 |
| shared 包体积增长（holiday 数据 ~10KB） | Tree-shakeable: 仅 load 实际调用的 layer |
| 双端引用时 `Date` 行为差异 | 只用 ISO 标准 API（`getFullYear()`, `getMonth()`, `getDate()`），避免 `toLocaleDateString` 等 |

## Open Questions

1. **节日日期范围是否应提前预计算并缓存？** 端午、中秋等农历节日每年公历日期不同，可在引擎初始化时预计算全年。
2. **locale 默认值**：从 `navigator.language` 读取还是用户手动设置？建议 v1 默认 `zh-CN`（做中国节+国际节），M1.4 在 settingsStore 中加 locale 字段。
3. **节日 PID**：同日多节日时特效是否叠加？设计为"不叠加"——取最高优先级节日，避免视觉混乱。
