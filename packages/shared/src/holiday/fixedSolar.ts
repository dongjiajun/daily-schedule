import type { Holiday } from './types'
import { HolidayLayer } from './types'

interface FixedSolarDef {
  month: number  // 1-12
  day: number    // 1-31
  id: string
  name: string
  englishName: string
  category: Holiday['category']
  priority: number
}

const FIXED_HOLIDAYS: FixedSolarDef[] = [
  { month: 1, day: 1,  id: 'new-year',          name: '元旦',        englishName: "New Year's Day",     category: 'SECULAR',     priority: 75 },
  { month: 2, day: 14, id: 'valentines',         name: '情人节',      englishName: "Valentine's Day",    category: 'SECULAR',     priority: 70 },
  { month: 3, day: 8,  id: 'womens-day',         name: '妇女节',      englishName: "Women's Day",        category: 'SECULAR',     priority: 40 },
  { month: 3, day: 17, id: 'st-patricks',        name: '圣帕特里克节', englishName: "St. Patrick's Day",  category: 'RELIGIOUS',   priority: 60 },
  { month: 4, day: 1,  id: 'april-fools',        name: '愚人节',      englishName: "April Fools' Day",   category: 'SECULAR',     priority: 30 },
  { month: 4, day: 22, id: 'earth-day',          name: '地球日',      englishName: 'Earth Day',           category: 'SECULAR',     priority: 35 },
  { month: 4, day: 23, id: 'world-book-day',     name: '世界读书日',   englishName: 'World Book Day',       category: 'SECULAR',     priority: 30 },
  { month: 5, day: 1,  id: 'labour-day',         name: '劳动节',      englishName: 'Labour Day',          category: 'SECULAR',     priority: 45 },
  { month: 6, day: 1,  id: 'childrens-day',      name: '儿童节',      englishName: "Children's Day",      category: 'SECULAR',     priority: 40 },
  { month: 6, day: 5,  id: 'world-environment-day', name: '世界环境日', englishName: 'World Environment Day', category: 'SECULAR',  priority: 30 },
  { month: 9, day: 21, id: 'peace-day',          name: '国际和平日',   englishName: 'International Peace Day', category: 'SECULAR',  priority: 30 },
  { month: 10, day: 31, id: 'halloween',         name: '万圣节',      englishName: 'Halloween',           category: 'RELIGIOUS',   priority: 80 },
  { month: 11, day: 1,  id: 'all-saints',        name: '万圣节',      englishName: "All Saints' Day",     category: 'RELIGIOUS',   priority: 55 },
  { month: 12, day: 24, id: 'christmas-eve',     name: '圣诞前夕',    englishName: 'Christmas Eve',       category: 'RELIGIOUS',   priority: 65 },
  { month: 12, day: 25, id: 'christmas',         name: '圣诞节',      englishName: 'Christmas Day',       category: 'RELIGIOUS',   priority: 90 },
  { month: 12, day: 31, id: 'new-years-eve',     name: '元旦前夕',    englishName: "New Year's Eve",      category: 'SECULAR',     priority: 70 },
]

export function getFixedSolarHolidays(date: Date): Holiday[] {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()

  return FIXED_HOLIDAYS
    .filter(h => h.month === month && h.day === day)
    .map(h => ({
      id: h.id,
      name: h.name,
      englishName: h.englishName,
      layer: HolidayLayer.FIXED_SOLAR,
      category: h.category,
      priority: h.priority,
      dateRange: [toDateStr(year, month, day), toDateStr(year, month, day)] as [string, string],
    }))
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
