# Tasks: 国际节日引擎 (Holiday Engine)

> 纯 TypeScript 库变更，无后端/数据库/API 影响。

## 1. 依赖安装
- [x] 1.1 `pnpm --filter @daily-schedule/shared add lunar-typescript` 安装农历依赖
- [x] 1.2 确认 `lunar-typescript` 在 `packages/shared/package.json` 中正确添加

## 2. 类型定义
- [x] 2.1 新建 `packages/shared/src/holiday/types.ts` — Holiday / HolidayLayer / HolidayCategory / HolidayTheme / EffectType 类型
- [x] 2.2 编写类型测试：确保枚举值正确导出

## 3. Layer 1: 固定公历节日
- [x] 3.1 新建 `packages/shared/src/holiday/fixedSolar.ts` — 静态映射表（15+ 节日）+ `getFixedSolarHolidays(date)`
- [x] 3.2 编写 `packages/shared/src/holiday/__tests__/fixedSolar.test.ts`（元旦/圣诞/万圣节/同日多节/非节日空返回）

## 4. Layer 2: 浮动公历节日
- [x] 4.1 新建 `packages/shared/src/holiday/floatingSolar.ts` — 感恩节/母亲节/父亲节/复活节算法 + `getFloatingSolarHolidays(date)`
- [x] 4.2 实现复活节匿名算法（1900-2099 覆盖）
- [x] 4.3 编写 `packages/shared/src/holiday/__tests__/floatingSolar.test.ts`（感恩节/母亲节/父亲节/复活节已知值验证/前一天不匹配）

## 5. Layer 3: 农历节日
- [x] 5.1 新建 `packages/shared/src/holiday/lunar.ts` — 农历节日定义（春节/元宵/端午/中秋/七夕/重阳/清明）+ `getLunarHolidays(date)`
- [x] 5.2 使用 `lunar-typescript` 的 `Solar.fromDate().getLunar()` 进行公历↔农历换算
- [x] 5.3 实现节日 range 逻辑（春节 7 天/中秋 3 天/端午 3 天等）
- [x] 5.4 编写 `packages/shared/src/holiday/__tests__/lunar.test.ts`（2026 春节/初三/初九/中秋/端午/元宵/七夕/重阳/清明）

## 6. Layer 4: 地区性节日
- [x] 6.1 新建 `packages/shared/src/holiday/regional.ts` — 地区性节日表（5+ 节日）+ locale 过滤 + `getRegionalHolidays(date, locale?)`
- [x] 6.2 编写 `packages/shared/src/holiday/__tests__/regional.test.ts`（排灯节 IN/亡灵节 MX/樱花季 JP-KR/无 locale 空返回）

## 7. 引擎 + 主题映射
- [x] 7.1 新建 `packages/shared/src/holiday/themeMapping.ts` — 节日 id → HolidayTheme 映射表（12+ 条目）+ fallback 默认主题
- [x] 7.2 新建 `packages/shared/src/holiday/engine.ts` — HolidayEngine（getHolidays / getActiveTheme）+ 全局单例 holidayEngine
- [x] 7.3 编写 `packages/shared/src/holiday/__tests__/engine.test.ts`（春节多源/优先级排序/活跃主题/null 主题/主题完整/单例）

## 8. 导出整合
- [x] 8.1 新建 `packages/shared/src/holiday/index.ts` — 统一导出（HolidayEngine / holidayEngine / 类型 / 各 layer 函数）
- [x] 8.2 更新 `packages/shared/src/index.ts` — 追加 `export * from './holiday'`

## 9. 全量验证
- [x] 9.1 `pnpm --filter @daily-schedule/shared run build` — 确认 shared 包编译通过
- [x] 9.2 `pnpm --filter @daily-schedule/shared run test` — 确认全部 holiday 测试通过（预估 5 个测试文件 30+ 用例）
- [x] 9.3 `cd frontend && pnpm run verify` — 确认前端 lint + build + test 无回归
- [x] 9.4 `cd backend && mvn test` — 确认后端无回归

## 10. 文档同步
- [x] 10.1 新 shared 包子模块 → 更新 `CLAUDE.md` 的 packages/shared 目录说明
- [x] 10.2 无新 API / 无新表 / 无新前端组件 → 8.1/8.2/8.3 打勾通过
- [x] 10.3 更新 `specs/CHANGELOG.md` — 记录 holiday-engine 变更
