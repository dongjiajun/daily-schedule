import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  clampToViewport,
  isInsideRect,
  avoidZones,
  determineMode,
  computeWanderTarget,
  computeAttractedTarget,
  computeRestingTarget,
  computeNextTarget,
  computeFacing,
  zoneCenter,
  createDefaultConfig,
} from '../roaming'
import type { AvoidZone, Zone } from '../roaming'

const DEFAULT_VIEWPORT = { width: 1200, height: 800 }
const BASE_CONFIG = createDefaultConfig(1200, 800)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('clampToViewport', () => {
  it('should not change position inside viewport', () => {
    const result = clampToViewport({ x: 100, y: 100 }, BASE_CONFIG)
    expect(result).toEqual({ x: 100, y: 100 })
  })

  it('should clamp x below padding', () => {
    const result = clampToViewport({ x: 5, y: 100 }, BASE_CONFIG)
    expect(result.x).toBe(20)
    expect(result.y).toBe(100)
  })

  it('should clamp x above viewport width', () => {
    const result = clampToViewport({ x: 1195, y: 100 }, BASE_CONFIG)
    expect(result.x).toBe(1180) // 1200 - 20
  })

  it('should clamp y below padding', () => {
    const result = clampToViewport({ x: 100, y: -5 }, BASE_CONFIG)
    expect(result.y).toBe(20)
  })

  it('should clamp y above viewport height', () => {
    const result = clampToViewport({ x: 100, y: 795 }, BASE_CONFIG)
    expect(result.y).toBe(780) // 800 - 20
  })
})

describe('isInsideRect', () => {
  const rect = { left: 100, top: 100, right: 200, bottom: 200 }

  it('inside', () => {
    expect(isInsideRect({ x: 150, y: 150 }, rect)).toBe(true)
  })

  it('on left boundary', () => {
    expect(isInsideRect({ x: 100, y: 150 }, rect)).toBe(true)
  })

  it('outside left', () => {
    expect(isInsideRect({ x: 99, y: 150 }, rect)).toBe(false)
  })

  it('outside right', () => {
    expect(isInsideRect({ x: 201, y: 150 }, rect)).toBe(false)
  })
})

describe('avoidZones', () => {
  const zones: AvoidZone[] = [
    {
      rect: { left: 300, top: 300, right: 600, bottom: 500 },
      strength: 'hard',
    },
  ]

  it('should not change position outside zone', () => {
    const result = avoidZones({ x: 100, y: 100 }, zones)
    expect(result).toEqual({ x: 100, y: 100 })
  })

  it('should push position outside zone', () => {
    const result = avoidZones({ x: 450, y: 400 }, zones)
    const inside = isInsideRect(result, zones[0].rect)
    expect(inside).toBe(false)
  })

  it('should handle soft zones by not enforcing', () => {
    const softZones: AvoidZone[] = [
      {
        rect: { left: 300, top: 300, right: 600, bottom: 500 },
        strength: 'soft',
      },
    ]
    const result = avoidZones({ x: 450, y: 400 }, softZones)
    // soft zones are skipped by avoidZones (only hard enforced)
    expect(result).toEqual({ x: 450, y: 400 })
  })
})

describe('determineMode', () => {
  it('should return wandering when recently interacted', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 1000,
      hasActiveZone: false,
      isNightTime: false,
    })
    expect(mode).toBe('wandering')
  })

  it('should return resting when idle > 2min', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 3 * 60 * 1000,
      hasActiveZone: false,
      isNightTime: false,
    })
    expect(mode).toBe('resting')
  })

  it('should return attracted when zone active', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 1000,
      hasActiveZone: true,
      isNightTime: false,
    })
    expect(mode).toBe('attracted')
  })

  it('should return resting at night when idle', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 3 * 60 * 1000,
      hasActiveZone: false,
      isNightTime: true,
    })
    expect(mode).toBe('resting')
  })
})

describe('computeWanderTarget', () => {
  it('should return position within viewport', () => {
    const target = computeWanderTarget({ x: 600, y: 400 }, BASE_CONFIG)
    expect(target.x).toBeGreaterThanOrEqual(20)
    expect(target.x).toBeLessThanOrEqual(1180)
    expect(target.y).toBeGreaterThanOrEqual(20)
    expect(target.y).toBeLessThanOrEqual(780)
  })

  it('should avoid hard zones', () => {
    const config = {
      ...BASE_CONFIG,
      avoidZones: [
        { rect: { left: 400, top: 300, right: 800, bottom: 500 }, strength: 'hard' as const },
      ],
    }
    const target = computeWanderTarget({ x: 600, y: 400 }, config)
    const inside = isInsideRect(target, config.avoidZones[0].rect)
    expect(inside).toBe(false)
  })

  it('should sample globally (30% branch) covering full viewport beyond local drift', () => {
    const config = {
      ...BASE_CONFIG,
      avoidZones: [
        { rect: { left: 300, top: 200, right: 900, bottom: 600 }, strength: 'soft' as const },
      ],
    }
    // mock 序列：第 1 个 random（全局采样判定）→ 0.1 < 0.3 → 走全域采样分支
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const target = computeWanderTarget({ x: 600, y: 400 }, config)
    expect(target.x).toBeGreaterThanOrEqual(20)
    expect(target.x).toBeLessThanOrEqual(1180)
    expect(target.y).toBeGreaterThanOrEqual(20)
    expect(target.y).toBeLessThanOrEqual(780)
    expect(mockRandom).toHaveBeenCalled()
  })

  it('should accept soft zone targets (50% acceptance — soft is not a wall)', () => {
    const config = {
      ...BASE_CONFIG,
      avoidZones: [
        { rect: { left: 300, top: 200, right: 900, bottom: 600 }, strength: 'soft' as const },
      ],
    }
    // mock 序列：全局采样判定 → 0.9（不走全域分支，走局部漂移）
    // 局部偏移 random（0.9 → 正偏移）→ soft 接受判定 0.9（< 0.5 false → 接受）
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const target = computeWanderTarget({ x: 600, y: 400 }, config)
    expect(target.x).toBeGreaterThanOrEqual(20)
    expect(target.x).toBeLessThanOrEqual(1180)
    expect(mockRandom).toHaveBeenCalled()
  })

  it('should keep rejecting hard zone targets', () => {
    const config = {
      ...BASE_CONFIG,
      avoidZones: [
        { rect: { left: 400, top: 300, right: 800, bottom: 500 }, strength: 'hard' as const },
      ],
    }
    // mock 序列：全局采样判定 0.9（局部漂移）→ 偏移 0.9（正偏移，可能落 hard 区）
    // hard 区完全拒绝 → fallback 全域采样仍在视口内且不在 hard 区内
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const target = computeWanderTarget({ x: 600, y: 400 }, config)
    const inside = isInsideRect(target, config.avoidZones[0].rect)
    expect(inside).toBe(false)
    expect(target.x).toBeGreaterThanOrEqual(20)
    expect(mockRandom).toHaveBeenCalled()
  })
})

describe('computeAttractedTarget', () => {
  it('should move toward target point', () => {
    const target = computeAttractedTarget(
      { x: 100, y: 100 },
      { x: 500, y: 500 },
      BASE_CONFIG,
    )
    // Should be closer to 500,500 than original
    const distToTarget = Math.hypot(target.x - 500, target.y - 500)
    const distFromOrigin = Math.hypot(100 - 500, 100 - 500)
    expect(distToTarget).toBeLessThan(distFromOrigin)
  })
})

describe('zoneCenter', () => {
  it('should compute geometric center of zone rect', () => {
    const zone: Zone = {
      id: 'z1',
      type: 'user-interaction',
      rect: { left: 100, top: 100, right: 200, bottom: 200 },
      weight: 1,
    }
    expect(zoneCenter(zone)).toEqual({ x: 150, y: 150 })
  })
})

describe('Zone model', () => {
  it('should carry type and payload data', () => {
    const zone: Zone = {
      id: 'day-2026-08-01',
      type: 'calendar-cell',
      rect: { left: 0, top: 0, right: 100, bottom: 100 },
      payload: { completion: 0.75, total: 4, completed: 3 },
      weight: 0.8,
      createdAt: 1000,
    }
    expect(zone.type).toBe('calendar-cell')
    expect(zone.payload).toEqual({ completion: 0.75, total: 4, completed: 3 })
    expect(zone.id).toBe('day-2026-08-01')
  })
})

describe('computeNextTarget', () => {
  const zoneAt = (x: number, y: number, size = 100): Zone => ({
    id: 'z',
    type: 'user-interaction',
    rect: { left: x - size / 2, top: y - size / 2, right: x + size / 2, bottom: y + size / 2 },
    weight: 1,
  })

  it('should move toward active zone center in attracted mode', () => {
    const zone = zoneAt(800, 600)
    const target = computeNextTarget({ x: 100, y: 100 }, BASE_CONFIG, 'attracted', { activeZone: zone })
    const distToCenter = Math.hypot(target.x - 800, target.y - 600)
    const distFromOrigin = Math.hypot(100 - 800, 100 - 600)
    expect(distToCenter).toBeLessThan(distFromOrigin)
  })

  it('should fall back to wandering when no active zone', () => {
    const target = computeNextTarget({ x: 600, y: 400 }, BASE_CONFIG, 'attracted')
    expect(target.x).toBeGreaterThanOrEqual(20)
    expect(target.x).toBeLessThanOrEqual(1180)
  })

  it('should abandon attraction when zone center is inside hard zone', () => {
    const config = {
      ...BASE_CONFIG,
      avoidZones: [
        { rect: { left: 400, top: 300, right: 800, bottom: 500 }, strength: 'hard' as const },
      ],
    }
    // zone 中心 (600, 400) 位于 hard 区内 → 放弃吸引，退回 wandering（目标不落入 hard 区）
    const zone = zoneAt(600, 400)
    const target = computeNextTarget({ x: 200, y: 200 }, config, 'attracted', { activeZone: zone })
    const inside = isInsideRect(target, config.avoidZones[0].rect)
    expect(inside).toBe(false)
  })

  it('should return current position in idle mode', () => {
    const target = computeNextTarget({ x: 600, y: 400 }, BASE_CONFIG, 'idle')
    expect(target).toEqual({ x: 600, y: 400 })
  })
})

describe('computeRestingTarget', () => {
  it('should return nearest resting spot', () => {
    const spots = [
      { x: 100, y: 100 },
      { x: 1100, y: 700 },
    ]
    const target = computeRestingTarget({ x: 50, y: 50 }, spots)
    expect(target).toEqual({ x: 100, y: 100 })
  })

  it('should return current position if no spots', () => {
    const target = computeRestingTarget({ x: 600, y: 400 }, [])
    expect(target).toEqual({ x: 600, y: 400 })
  })
})

describe('computeFacing', () => {
  it('should face right when moving right', () => {
    expect(computeFacing(0, 100)).toBe('right')
  })

  it('should face left when moving left', () => {
    expect(computeFacing(100, 50)).toBe('left')
  })

  it('should face right when stationary', () => {
    expect(computeFacing(100, 100)).toBe('right')
  })
})

describe('Zone payload 类型收紧', () => {
  it('calendar-cell 携带完成度结构（date + completion）', () => {
    const cell: Zone<'calendar-cell'> = {
      id: 'calendar-cell-2026-08-01',
      type: 'calendar-cell',
      rect: { left: 0, top: 0, right: 100, bottom: 100 },
      payload: { date: '2026-08-01', completion: 80 },
      weight: 1,
    }
    // 编译期约束：payload 必须含 date/completion
    expect(cell.payload).toEqual({ date: '2026-08-01', completion: 80 })
  })

  it('非 calendar-cell 类型无 payload 结构约束（可选）', () => {
    const spot: Zone<'pet-spot'> = {
      id: 'pet-home-spot',
      type: 'pet-spot',
      rect: { left: 0, top: 0, right: 100, bottom: 100 },
      weight: 1,
    }
    expect(spot.payload).toBeUndefined()
  })

  it('通用 Zone 类型（未指定）的 payload 保持可选', () => {
    const z: Zone = {
      id: 'generic',
      type: 'user-interaction',
      rect: { left: 0, top: 0, right: 100, bottom: 100 },
      weight: 1,
    }
    expect(z.payload).toBeUndefined()
  })
})
