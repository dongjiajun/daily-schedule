import { describe, expect, it } from 'vitest'
// shared 跨端复用回归：小程序侧消费 Web 端同源引擎，纯函数输出必须确定性
import { holidayEngine } from '@daily-schedule/shared/holiday'
import { computeNextTarget, createDefaultConfig } from '@daily-schedule/shared/pet'

describe('shared 包跨端复用', () => {
  it('holidayEngine：固定日期判定确定性（2026-01-01 元旦）', () => {
    const holidays = holidayEngine.getHolidays(new Date('2026-01-01T12:00:00+08:00'))
    const names = holidays.map(h => h.name)
    expect(names).toContain('元旦')
  })

  it('holidayEngine：普通日期无节日', () => {
    const holidays = holidayEngine.getHolidays(new Date('2026-08-17T12:00:00+08:00'))
    expect(holidays).toHaveLength(0)
  })

  it('pet 引擎：wandering 目标始终在视口安全范围内', () => {
    const config = createDefaultConfig(375, 667)
    const start = { x: 100, y: 100 }
    for (let i = 0; i < 20; i++) {
      const target = computeNextTarget(start, config, 'wandering')
      expect(target.x).toBeGreaterThanOrEqual(0)
      expect(target.x).toBeLessThanOrEqual(375)
      expect(target.y).toBeGreaterThanOrEqual(0)
      expect(target.y).toBeLessThanOrEqual(667)
    }
  })

  it('pet 引擎：resting 模式目标落在小窝点位', () => {
    const config = createDefaultConfig(375, 667)
    const target = computeNextTarget({ x: 50, y: 50 }, config, 'resting')
    // 小窝点来自 config.restingSpots，目标必须与某个点位一致（不游走）
    const isRestingSpot = config.restingSpots.some(
      s => Math.abs(s.x - target.x) < 1 && Math.abs(s.y - target.y) < 1
    )
    expect(isRestingSpot).toBe(true)
  })
})
