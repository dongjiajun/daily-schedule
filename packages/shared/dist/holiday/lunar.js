import { Lunar } from 'lunar-typescript';
import { HolidayLayer } from './types';
import { toDateStr } from './fixedSolar';
const LUNAR_HOLIDAYS = [
    { lunarMonth: 1, lunarDay: 1, id: 'spring-festival', name: '春节', englishName: 'Spring Festival', category: 'TRADITIONAL', priority: 100, rangeDays: 7 },
    { lunarMonth: 1, lunarDay: 15, id: 'lantern-festival', name: '元宵节', englishName: 'Lantern Festival', category: 'TRADITIONAL', priority: 75, rangeDays: 1 },
    { lunarMonth: 5, lunarDay: 5, id: 'dragon-boat', name: '端午节', englishName: 'Dragon Boat Festival', category: 'TRADITIONAL', priority: 80, rangeDays: 3 },
    { lunarMonth: 8, lunarDay: 15, id: 'mid-autumn', name: '中秋节', englishName: 'Mid-Autumn Festival', category: 'TRADITIONAL', priority: 85, rangeDays: 3 },
    { lunarMonth: 7, lunarDay: 7, id: 'qixi', name: '七夕', englishName: "Qixi Festival", category: 'TRADITIONAL', priority: 65, rangeDays: 1 },
    { lunarMonth: 9, lunarDay: 9, id: 'chongyang', name: '重阳节', englishName: 'Double Ninth Festival', category: 'TRADITIONAL', priority: 50, rangeDays: 1 },
    { lunarMonth: 4, lunarDay: 5, id: 'qingming', name: '清明节', englishName: 'Qingming Festival', category: 'TRADITIONAL', priority: 70, rangeDays: 3 },
];
export function getLunarHolidays(date) {
    const year = date.getFullYear();
    const results = [];
    for (const def of LUNAR_HOLIDAYS) {
        // 农历节日 → 公历日期：Lunar.fromYmd() → .getSolar() → Date
        const lunar = Lunar.fromYmd(year, def.lunarMonth, def.lunarDay);
        const coreSolar = lunar.getSolar();
        const coreJsDate = new Date(coreSolar.getYear(), coreSolar.getMonth() - 1, coreSolar.getDay());
        // 检查当前日期是否在 range 内
        const halfRange = Math.floor(def.rangeDays / 2);
        const daysFrom = new Date(coreJsDate);
        daysFrom.setDate(daysFrom.getDate() - halfRange);
        const daysTo = new Date(coreJsDate);
        daysTo.setDate(daysTo.getDate() + (def.rangeDays - halfRange - 1));
        if (date.getTime() >= daysFrom.getTime() && date.getTime() <= daysTo.getTime()) {
            const fromStr = toDateStr(daysFrom.getFullYear(), daysFrom.getMonth() + 1, daysFrom.getDate());
            const toStr = toDateStr(daysTo.getFullYear(), daysTo.getMonth() + 1, daysTo.getDate());
            results.push({
                id: def.id,
                name: def.name,
                englishName: def.englishName,
                layer: HolidayLayer.LUNAR,
                category: def.category,
                priority: def.priority,
                dateRange: [fromStr, toStr],
            });
        }
    }
    return results;
}
//# sourceMappingURL=lunar.js.map