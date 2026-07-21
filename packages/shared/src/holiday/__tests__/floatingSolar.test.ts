import { describe, it, expect } from 'vitest'
import { getFloatingSolarHolidays, easterSunday, nthWeekdayOfMonth } from '../floatingSolar'

describe('easterSunday', () => {
  it('2026 年复活节 = 4月5日', () => {
    const d = easterSunday(2026)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // 4月
    expect(d.getDate()).toBe(5)
  })

  it('2024 年复活节 = 3月31日', () => {
    const d = easterSunday(2024)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(2)
    expect(d.getDate()).toBe(31)
  })

  it('2000 年复活节 = 4月23日', () => {
    const d = easterSunday(2000)
    expect(d.getFullYear()).toBe(2000)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(23)
  })
})

describe('nthWeekdayOfMonth', () => {
  it('2026 感恩节 = 11月26日（第4个周四）', () => {
    const d = nthWeekdayOfMonth(2026, 11, 4, 4)
    expect(d.getMonth()).toBe(10) // 11月
    expect(d.getDate()).toBe(26)
  })

  it('2026 母亲节 = 5月10日（第2个周日）', () => {
    const d = nthWeekdayOfMonth(2026, 5, 0, 2)
    expect(d.getMonth()).toBe(4)
    expect(d.getDate()).toBe(10)
  })
})

describe('getFloatingSolarHolidays', () => {
  it('2026 感恩节当天', () => {
    const result = getFloatingSolarHolidays(new Date(2026, 10, 26))
    expect(result.some(h => h.id === 'thanksgiving')).toBe(true)
  })

  it('2026 母亲节当天', () => {
    const result = getFloatingSolarHolidays(new Date(2026, 4, 10))
    expect(result.some(h => h.id === 'mothers-day')).toBe(true)
  })

  it('2026 父亲节当天', () => {
    const result = getFloatingSolarHolidays(new Date(2026, 5, 21))
    expect(result.some(h => h.id === 'fathers-day')).toBe(true)
  })

  it('2026 复活节当天', () => {
    const result = getFloatingSolarHolidays(new Date(2026, 3, 5))
    expect(result.some(h => h.id === 'easter')).toBe(true)
  })

  it('感恩节前一天不匹配', () => {
    const result = getFloatingSolarHolidays(new Date(2026, 10, 25))
    expect(result.some(h => h.id === 'thanksgiving')).toBe(false)
  })

  it('非节日日期返回空', () => {
    const result = getFloatingSolarHolidays(new Date(2026, 6, 15))
    expect(result).toEqual([])
  })
})
