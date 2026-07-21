import { HolidayLayer } from './types';
import { toDateStr } from './fixedSolar';
/**
 * 复活节匿名算法（Anonymous Gregorian algorithm）
 * 返回春分满月后第一个周日，覆盖 1900-2099 年。
 */
function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}
/**
 * 获取某月第 N 个指定星期几的日期。
 * weekOfDay: 0=周日, 1=周一...6=周六
 * nth: 1=第1个, 2=第2个...5=第5个（可能不存在）
 */
function nthWeekdayOfMonth(year, month, weekOfDay, nth) {
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const dayOffset = (weekOfDay - firstWeekday + 7) % 7;
    const day = 1 + dayOffset + (nth - 1) * 7;
    return new Date(year, month - 1, day);
}
const FLOATING_DEFS = [
    {
        id: 'thanksgiving',
        name: '感恩节',
        englishName: 'Thanksgiving',
        category: 'SECULAR',
        priority: 80,
        getDate: (year) => nthWeekdayOfMonth(year, 11, 4, 4), // 11月第4个周四
    },
    {
        id: 'mothers-day',
        name: '母亲节',
        englishName: "Mother's Day",
        category: 'SECULAR',
        priority: 70,
        getDate: (year) => nthWeekdayOfMonth(year, 5, 0, 2), // 5月第2个周日
    },
    {
        id: 'fathers-day',
        name: '父亲节',
        englishName: "Father's Day",
        category: 'SECULAR',
        priority: 65,
        getDate: (year) => nthWeekdayOfMonth(year, 6, 0, 3), // 6月第3个周日
    },
    {
        id: 'easter',
        name: '复活节',
        englishName: 'Easter',
        category: 'RELIGIOUS',
        priority: 85,
        getDate: easterSunday,
    },
];
export function getFloatingSolarHolidays(date) {
    const year = date.getFullYear();
    const results = [];
    for (const def of FLOATING_DEFS) {
        const holidayDate = def.getDate(year);
        if (holidayDate.getFullYear() !== year)
            continue; // 跨年边缘情况（感恩节不会跨年但安全处理）
        if (sameDay(date, holidayDate)) {
            const ds = toDateStr(year, holidayDate.getMonth() + 1, holidayDate.getDate());
            results.push({
                id: def.id,
                name: def.name,
                englishName: def.englishName,
                layer: HolidayLayer.FLOATING_SOLAR,
                category: def.category,
                priority: def.priority,
                dateRange: [ds, ds],
            });
        }
    }
    return results;
}
export function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}
// 导出用于测试的辅助函数
export { easterSunday, nthWeekdayOfMonth };
//# sourceMappingURL=floatingSolar.js.map