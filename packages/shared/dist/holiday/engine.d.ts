import type { Holiday, HolidayTheme } from './types';
export interface HolidayOptions {
    locale?: string;
}
export declare class HolidayEngine {
    /**
     * 返回给定日期的所有活跃节日，按优先级降序排列。
     * 每个节日已注入主题映射。
     */
    getHolidays(date: Date, options?: HolidayOptions): Holiday[];
    /**
     * 返回当日最高优先级节日的主题，无节日返回 null。
     */
    getActiveTheme(date: Date, options?: HolidayOptions): HolidayTheme | null;
}
export declare const holidayEngine: HolidayEngine;
//# sourceMappingURL=engine.d.ts.map