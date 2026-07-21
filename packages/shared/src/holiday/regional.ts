import type { Holiday } from './types'
import { HolidayLayer } from './types'
import { toDateStr } from './fixedSolar'

interface RegionalHolidayDef {
  locale: string[]
  month: number
  day: number
  id: string
  name: string
  englishName: string
  category: Holiday['category']
  priority: number
}

const REGIONAL_HOLIDAYS: RegionalHolidayDef[] = [
  { locale: ['IN'],       month: 10, day: 24, id: 'diwali',          name: '排灯节',     englishName: 'Diwali',              category: 'RELIGIOUS', priority: 80 },
  { locale: ['MX'],       month: 11, day: 2,  id: 'dia-de-muertos',  name: '亡灵节',     englishName: 'Día de Muertos',       category: 'TRADITIONAL', priority: 75 },
  { locale: ['JP', 'KR'], month: 3,  day: 27, id: 'sakura',          name: '樱花季',     englishName: 'Sakura Season',        category: 'REGIONAL',  priority: 55 },
  { locale: ['DE'],       month: 9,  day: 20, id: 'oktoberfest',     name: '啤酒节',     englishName: 'Oktoberfest',          category: 'SECULAR',   priority: 60 },
  { locale: ['BR'],       month: 2,  day: 24, id: 'carnival',        name: '狂欢节',     englishName: 'Carnival',             category: 'SECULAR',   priority: 65 },
]

export function getRegionalHolidays(date: Date, locale?: string): Holiday[] {
  if (!locale) return []

  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()

  return REGIONAL_HOLIDAYS
    .filter(h => h.month === month && h.day === day)
    .filter(h => h.locale.map(l => l.toUpperCase()).includes(locale.toUpperCase()))
    .map(h => ({
      id: h.id,
      name: h.name,
      englishName: h.englishName,
      layer: HolidayLayer.REGIONAL,
      category: h.category,
      priority: h.priority,
      locale: h.locale,
      dateRange: [toDateStr(year, month, day), toDateStr(year, month, day)] as [string, string],
    }))
}
