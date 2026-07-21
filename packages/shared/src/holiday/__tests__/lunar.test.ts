import { describe, it, expect } from 'vitest'
import { getLunarHolidays } from '../lunar'

describe('getLunarHolidays', () => {
  // 2026年农历正月初一 = 2026-02-17
  it('2026 春节（正月初一）', () => {
    const result = getLunarHolidays(new Date(2026, 1, 17))
    expect(result.some(h => h.id === 'spring-festival')).toBe(true)
    const sf = result.find(h => h.id === 'spring-festival')!
    expect(sf.priority).toBe(100)
    expect(sf.name).toBe('春节')
  })

  it('2026 春节初三（在 range 内）', () => {
    const result = getLunarHolidays(new Date(2026, 1, 19))
    expect(result.some(h => h.id === 'spring-festival')).toBe(true)
  })

  it('2026 春节初九（range 外）', () => {
    const result = getLunarHolidays(new Date(2026, 1, 25))
    expect(result.some(h => h.id === 'spring-festival')).toBe(false)
  })

  it('2026 元宵节', () => {
    const result = getLunarHolidays(new Date(2026, 2, 3))
    expect(result.some(h => h.id === 'lantern-festival')).toBe(true)
  })

  it('2026 端午', () => {
    const result = getLunarHolidays(new Date(2026, 5, 19))
    expect(result.some(h => h.id === 'dragon-boat')).toBe(true)
  })

  it('2026 中秋', () => {
    const result = getLunarHolidays(new Date(2026, 8, 25))
    expect(result.some(h => h.id === 'mid-autumn')).toBe(true)
  })

  it('2026 七夕', () => {
    const result = getLunarHolidays(new Date(2026, 7, 19)) // 农历七月初七
    expect(result.some(h => h.id === 'qixi')).toBe(true)
    expect(result.find(h => h.id === 'qixi')!.name).toBe('七夕')
  })

  it('2026 重阳', () => {
    const result = getLunarHolidays(new Date(2026, 9, 18)) // 农历九月初九
    expect(result.some(h => h.id === 'chongyang')).toBe(true)
    expect(result.find(h => h.id === 'chongyang')!.name).toBe('重阳节')
  })

  it('2026 清明', () => {
    const result = getLunarHolidays(new Date(2026, 4, 21)) // 农历四月初五
    expect(result.some(h => h.id === 'qingming')).toBe(true)
    expect(result.find(h => h.id === 'qingming')!.name).toBe('清明节')
  })

  it('non-holiday returns empty', () => {
    const result = getLunarHolidays(new Date(2026, 6, 15))
    expect(result).toEqual([])
  })
})
