import { describe, it, expect } from 'vitest'
import { getFixedSolarHolidays } from '../fixedSolar'

describe('getFixedSolarHolidays', () => {
  it('元旦 2026-01-01', () => {
    const result = getFixedSolarHolidays(new Date(2026, 0, 1))
    expect(result.some(h => h.id === 'new-year')).toBe(true)
    expect(result.find(h => h.id === 'new-year')!.name).toBe('元旦')
  })

  it('圣诞节 2026-12-25', () => {
    const result = getFixedSolarHolidays(new Date(2026, 11, 25))
    expect(result.some(h => h.id === 'christmas')).toBe(true)
    expect(result.find(h => h.id === 'christmas')!.priority).toBe(90)
  })

  it('万圣节 2026-10-31', () => {
    const result = getFixedSolarHolidays(new Date(2026, 9, 31))
    expect(result.some(h => h.id === 'halloween')).toBe(true)
  })

  it('情人节 2026-02-14', () => {
    const result = getFixedSolarHolidays(new Date(2026, 1, 14))
    expect(result.some(h => h.id === 'valentines')).toBe(true)
  })

  it('非节日日期返回空', () => {
    const result = getFixedSolarHolidays(new Date(2026, 2, 22)) // 3月22日
    expect(result).toEqual([])
  })

  it('同日双节（12月24日仅圣诞前夕）', () => {
    // 12月24日是圣诞前夕，12月25日是圣诞本身——它们不同天
    const eve = getFixedSolarHolidays(new Date(2026, 11, 24))
    expect(eve.some(h => h.id === 'christmas-eve')).toBe(true)

    const day = getFixedSolarHolidays(new Date(2026, 11, 25))
    expect(day.some(h => h.id === 'christmas')).toBe(true)
  })

  it('覆盖至少 15 个节日', () => {
    const ids = new Set<string>()
    for (let m = 0; m < 12; m++) {
      for (let d = 0; d < 32; d++) {
        const date = new Date(2026, m, d)
        if (date.getMonth() !== m) continue
        getFixedSolarHolidays(date).forEach(h => ids.add(h.id))
      }
    }
    expect(ids.size).toBeGreaterThanOrEqual(15)
  })
})
