import type { Holiday, HolidayTheme } from './types'
import { getFixedSolarHolidays } from './fixedSolar'
import { getFloatingSolarHolidays } from './floatingSolar'
import { getLunarHolidays } from './lunar'
import { getRegionalHolidays } from './regional'
import { getThemeForHoliday } from './themeMapping'

export interface HolidayOptions {
  locale?: string
}

export class HolidayEngine {
  /**
   * 返回给定日期的所有活跃节日，按优先级降序排列。
   * 每个节日已注入主题映射。
   */
  getHolidays(date: Date, options?: HolidayOptions): Holiday[] {
    const holidays: Holiday[] = [
      ...getFixedSolarHolidays(date),
      ...getFloatingSolarHolidays(date),
      ...getLunarHolidays(date),
      ...getRegionalHolidays(date, options?.locale),
    ]

    for (const h of holidays) {
      h.theme = getThemeForHoliday(h.id)
    }

    return holidays.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 返回当日最高优先级节日的主题，无节日返回 null。
   */
  getActiveTheme(date: Date, options?: HolidayOptions): HolidayTheme | null {
    const holidays = this.getHolidays(date, options)
    return holidays.length > 0 ? holidays[0].theme! : null
  }
}

export const holidayEngine = new HolidayEngine()
