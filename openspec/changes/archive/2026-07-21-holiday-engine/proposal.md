# Proposal: 国际节日引擎 (Holiday Engine)

## Why
日程管理系统 v3.1 仅有 5 套静态主题，无时间感知能力。全球化路线要求覆盖国际节日——春节、圣诞、万圣节、感恩节、排灯节等 12+ 节日，且需支持农历换算（春节、中秋、端午等）。节日引擎是 M1.4（节日主题自动切换 + 特效）的底层依赖，也是产品国际化第一步。

## What Changes
- `packages/shared/` 新增 `holiday/` 子模块：四层节日数据（固定公历 / 浮动公历 / 农历 / 地区性）+ HolidayEngine
- 安装 `lunar-typescript` 依赖（农历日期换算）
- 新增 `Holiday`、`HolidayLayer`、`HolidayThemeMapping` 类型定义
- 引擎核心：`getHolidays(date: Date): Holiday[]` — 给定日期返回当日活跃节日列表
- **BREAKING**: 无（纯新增库，不影响现有 API 和模块）

## Capabilities

### New Capabilities
- `fixed-solar-holidays`: 固定公历节日 — 元旦、情人节、圣诞、万圣节等，静态日期映射表
- `floating-solar-holidays`: 浮动公历节日 — 感恩节（11 月第 4 周四）、母亲节（5 月第 2 周日）、复活节（春分满月后周日，算法实现）
- `lunar-holidays`: 农历节日 — 春节、元宵、端午、中秋、七夕、重阳、清明，依赖 `lunar-typescript` 库换算
- `regional-holidays`: 地区性节日 — 排灯节（印度）、亡灵节（墨西哥）、樱花季（日本），locale 过滤 + 可扩展数据
- `holiday-engine`: 引擎入口 — 统一查询接口 + 主题映射（节日→颜色系/特效类型/宠物装扮建议）

## API Contract Impact
无影响。此 change 不涉及任何后端 API 或 `specs/openapi.yaml`——节日引擎是纯 TypeScript 库，运行在前端侧。

## DDD Layer Impact
无影响。不涉及后端 Java 代码。

## Database Impact
无影响。节日数据全部硬编码在 TypeScript 文件中（~200 行数据），无需持久化。

## Impact
- **新增文件**: `packages/shared/src/holiday/` 下 8 个文件（types / fixedSolar / floatingSolar / lunar / regional / engine / themeMapping / index）
- **新增依赖**: `lunar-typescript`（packages/shared/package.json）
- **测试文件**: `packages/shared/src/holiday/__tests__/` 下 4-5 个测试文件
- **消费者**: M1.4（`core/styles/holiday-themes.css` + `core/components/effects/`）将调用 `getHolidays()` 决定当日主题和特效
- **文档**: `docs/frontend/component-catalog.md`（如特效组件需要登记）
