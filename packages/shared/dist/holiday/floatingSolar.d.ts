import type { Holiday } from './types';
/**
 * 复活节匿名算法（Anonymous Gregorian algorithm）
 * 返回春分满月后第一个周日，覆盖 1900-2099 年。
 */
declare function easterSunday(year: number): Date;
/**
 * 获取某月第 N 个指定星期几的日期。
 * weekOfDay: 0=周日, 1=周一...6=周六
 * nth: 1=第1个, 2=第2个...5=第5个（可能不存在）
 */
declare function nthWeekdayOfMonth(year: number, month: number, weekOfDay: number, nth: number): Date;
export declare function getFloatingSolarHolidays(date: Date): Holiday[];
export declare function sameDay(a: Date, b: Date): boolean;
export { easterSunday, nthWeekdayOfMonth };
//# sourceMappingURL=floatingSolar.d.ts.map