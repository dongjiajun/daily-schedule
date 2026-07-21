import { describe, it, expect } from 'vitest'
import { getRegionalHolidays } from '../regional'

describe('getRegionalHolidays', () => {
  it('排灯节 locale=IN', () => {
    const result = getRegionalHolidays(new Date(2026, 9, 24), 'IN')
    expect(result.some(h => h.id === 'diwali')).toBe(true)
  })

  it('排灯节 locale=CN 不返回', () => {
    const result = getRegionalHolidays(new Date(2026, 9, 24), 'CN')
    expect(result.some(h => h.id === 'diwali')).toBe(false)
  })

  it('樱花季 locale=JP', () => {
    const result = getRegionalHolidays(new Date(2026, 2, 27), 'JP')
    expect(result.some(h => h.id === 'sakura')).toBe(true)
  })

  it('樱花季 locale=KR（双 locale）', () => {
    const result = getRegionalHolidays(new Date(2026, 2, 27), 'KR')
    expect(result.some(h => h.id === 'sakura')).toBe(true)
  })

  it('无 locale 返回空', () => {
    const result = getRegionalHolidays(new Date(2026, 9, 24))
    expect(result).toEqual([])
  })

  it('至少覆盖 5 个地区性节日', () => {
    // 直接检查配置的节日 ID
    const allLocales = ['IN', 'MX', 'JP', 'DE', 'BR']
    const ids = new Set<string>()
    for (const loc of allLocales) {
      // 遍历全年找匹配
      for (let m = 0; m < 12; m++) {
        for (let d = 0; d < 31; d++) {
          const date = new Date(2026, m, d)
          if (date.getMonth() !== m) continue
          getRegionalHolidays(date, loc).forEach(h => ids.add(h.id))
        }
      }
    }
    expect(ids.size).toBeGreaterThanOrEqual(5)
  })
})
