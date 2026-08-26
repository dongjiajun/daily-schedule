import { describe, expect, it } from 'vitest'
import {
  addDays, buildMonthGrid, dateKeyFromDate, eventDateKey, formatMonthTitle, formatTime, monthRange, todayKey,
} from '../lib/calendar-date'

/**
 * 日历日期纯函数回归（字符串切片方案，不依赖 Taro 运行时）。
 * 关键不变量：42 格周一起始、首格=1 日所在周周一、补位 inMonth=false、
 * 范围上界=末格次日 00:00（重叠查询语义）。
 */
describe('buildMonthGrid', () => {
  it('2026-08：首格为 7/27 周一，末格 9/6 周日，共 42 格', () => {
    // 2026-08-01 是周六 → 周一起始偏移 5 → 首格 2026-07-27
    const grid = buildMonthGrid(2026, 8)
    expect(grid).toHaveLength(42)
    expect(grid[0].key).toBe('2026-07-27')
    expect(grid[0].day).toBe(27)
    expect(grid[0].inMonth).toBe(false)
    expect(grid[5].key).toBe('2026-08-01')
    expect(grid[5].inMonth).toBe(true)
    expect(grid[35].key).toBe('2026-08-31')
    expect(grid[41].key).toBe('2026-09-06')
    expect(grid[41].inMonth).toBe(false)
  })

  it('补位与当月分界：仅当月 31 格 inMonth=true', () => {
    const grid = buildMonthGrid(2026, 8)
    const inMonth = grid.filter(c => c.inMonth)
    expect(inMonth).toHaveLength(31)
    expect(inMonth[0].key).toBe('2026-08-01')
    expect(inMonth[30].key).toBe('2026-08-31')
  })

  it('闰年二月：2028-02 共 29 个当月格，首格 1/31 周一', () => {
    // 2028-02-01 是周二 → 偏移 1 → 首格 2028-01-31
    const grid = buildMonthGrid(2028, 2)
    expect(grid[0].key).toBe('2028-01-31')
    const inMonth = grid.filter(c => c.inMonth)
    expect(inMonth).toHaveLength(29)
  })

  it('跨年补位：2026-01 首格 2025-12-29', () => {
    // 2026-01-01 是周四 → 偏移 3 → 首格 2025-12-29
    const grid = buildMonthGrid(2026, 1)
    expect(grid[0].key).toBe('2025-12-29')
    expect(grid[41].key).toBe('2026-02-08')
  })

  it('今天格 isToday=true（当月网格）', () => {
    const today = todayKey()
    const [y, m] = today.split('-').map(Number)
    const grid = buildMonthGrid(y, m)
    const todayCell = grid.find(c => c.key === today)
    expect(todayCell?.isToday).toBe(true)
    const others = grid.filter(c => c.key !== today && c.isToday)
    expect(others).toHaveLength(0)
  })

  it('月内每个日期键唯一且连续递增', () => {
    const grid = buildMonthGrid(2026, 8)
    const keys = grid.map(c => c.key)
    expect(new Set(keys).size).toBe(42)
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i]).toBe(addDays(keys[0], i))
    }
  })
})

describe('monthRange', () => {
  it('范围 = 首格 00:00 → 末格次日 00:00', () => {
    const grid = buildMonthGrid(2026, 8)
    const range = monthRange(grid)
    expect(range.start).toBe('2026-07-27T00:00:00')
    expect(range.end).toBe('2026-09-07T00:00:00')
  })

  it('跨年网格范围正确（2026-01）', () => {
    const grid = buildMonthGrid(2026, 1)
    const range = monthRange(grid)
    expect(range.start).toBe('2025-12-29T00:00:00')
    expect(range.end).toBe('2026-02-09T00:00:00')
  })
})

describe('日期键与格式化', () => {
  it('dateKeyFromDate 补零', () => {
    expect(dateKeyFromDate(new Date(2026, 7, 5))).toBe('2026-08-05')
    expect(dateKeyFromDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('eventDateKey 取前 10 位（不解析）', () => {
    expect(eventDateKey('2026-08-22T09:05:00')).toBe('2026-08-22')
  })

  it('formatTime 切片 HH:mm（不解析）', () => {
    expect(formatTime('2026-08-22T09:05:00')).toBe('09:05')
    expect(formatTime('2026-08-22T23:59:59')).toBe('23:59')
  })

  it('formatMonthTitle 中文标题', () => {
    expect(formatMonthTitle(2026, 8)).toBe('2026年8月')
    expect(formatMonthTitle(2025, 12)).toBe('2025年12月')
  })
})
