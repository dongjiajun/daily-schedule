import { describe, it, expect } from 'vitest'
import { holidayEngine } from '../engine'
import { getThemeForHoliday, FALLBACK_THEME } from '../themeMapping'

describe('HolidayEngine.getHolidays', () => {
  it('春节当日返回多源节日（含主题注入）', () => {
    const result = holidayEngine.getHolidays(new Date(2026, 1, 17), { locale: 'CN' })
    expect(result.length).toBeGreaterThan(0)
    // 春节优先级最高
    expect(result[0].id).toBe('spring-festival')
    expect(result[0].theme).toBeDefined()
    expect(result[0].theme!.primaryColor).toBe('#E63946')
  })

  it('圣诞节返回主题', () => {
    const result = holidayEngine.getHolidays(new Date(2026, 11, 25))
    expect(result.some(h => h.id === 'christmas')).toBe(true)
    expect(result.find(h => h.id === 'christmas')!.theme!.effectType).toBe('snow')
  })

  it('普通日期返回空', () => {
    const result = holidayEngine.getHolidays(new Date(2026, 6, 15))
    expect(result).toEqual([])
  })

  it('按优先级排序', () => {
    // 12月25日只有圣诞节
    const result = holidayEngine.getHolidays(new Date(2026, 11, 25))
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].priority).toBeGreaterThanOrEqual(result[i].priority)
    }
  })
})

describe('HolidayEngine.getActiveTheme', () => {
  it('春节返回春节主题', () => {
    const theme = holidayEngine.getActiveTheme(new Date(2026, 1, 17), { locale: 'CN' })
    expect(theme).not.toBeNull()
    expect(theme!.effectType).toBe('firework')
  })

  it('无节日返回 null', () => {
    const theme = holidayEngine.getActiveTheme(new Date(2026, 6, 15))
    expect(theme).toBeNull()
  })
})

describe('theme mapping', () => {
  it('已知节日 id 均有主题', () => {
    const knownIds = [
      'spring-festival', 'christmas', 'halloween', 'mid-autumn', 'dragon-boat',
      'valentines', 'new-year', 'thanksgiving', 'st-patricks', 'sakura',
      'diwali', 'easter', 'christmas-eve', 'lantern-festival', 'qingming',
      'new-years-eve', 'all-saints', 'world-book-day', 'world-environment-day',
    ]
    for (const id of knownIds) {
      const theme = getThemeForHoliday(id)
      expect(theme).toBeDefined()
      expect(theme.primaryColor).toBeDefined()
    }
  })

  it('未知 id 返回 fallback 主题', () => {
    const theme = getThemeForHoliday('nonexistent-holiday')
    expect(theme).toEqual(FALLBACK_THEME)
  })
})

describe('holidayEngine singleton', () => {
  it('is a HolidayEngine instance', () => {
    expect(holidayEngine).toBeDefined()
    expect(typeof holidayEngine.getHolidays).toBe('function')
  })
})
