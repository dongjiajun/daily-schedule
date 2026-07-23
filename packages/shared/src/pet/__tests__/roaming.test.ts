import { describe, it, expect } from 'vitest'
import {
  clampToViewport,
  isInsideRect,
  avoidZones,
  determineMode,
  computeWanderTarget,
  computeAttractedTarget,
  computeRestingTarget,
  computeFacing,
  createDefaultConfig,
} from '../roaming'
import type { AvoidZone } from '../roaming'

const DEFAULT_VIEWPORT = { width: 1200, height: 800 }
const BASE_CONFIG = createDefaultConfig(1200, 800)

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
      hasActiveInterestPoint: false,
      isNightTime: false,
    })
    expect(mode).toBe('wandering')
  })

  it('should return resting when idle > 2min', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 3 * 60 * 1000,
      hasActiveInterestPoint: false,
      isNightTime: false,
    })
    expect(mode).toBe('resting')
  })

  it('should return attracted when interest point active', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 1000,
      hasActiveInterestPoint: true,
      isNightTime: false,
    })
    expect(mode).toBe('attracted')
  })

  it('should return resting at night when idle', () => {
    const mode = determineMode({
      lastInteractionAt: Date.now() - 3 * 60 * 1000,
      hasActiveInterestPoint: false,
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
})

describe('computeAttractedTarget', () => {
  it('should move toward interest point', () => {
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
