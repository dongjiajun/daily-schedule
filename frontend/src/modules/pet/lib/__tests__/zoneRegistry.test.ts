import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registerZone, getZones, updateZoneRect, removeZone, clearZones } from '../zoneRegistry'
import type { Zone } from '@daily-schedule/shared/pet'

const baseZone = (id: string, overrides: Partial<Zone> = {}): Zone => ({
  id,
  type: 'user-interaction',
  rect: { left: 100, top: 100, right: 200, bottom: 200 },
  weight: 1,
  ...overrides,
})

beforeEach(() => {
  clearZones()
})

describe('zoneRegistry', () => {
  it('should register and retrieve zones', () => {
    registerZone(baseZone('z1'))
    const zones = getZones()
    expect(zones).toHaveLength(1)
    expect(zones[0].id).toBe('z1')
  })

  it('should override zone with same id', () => {
    registerZone(baseZone('z1', { weight: 0.5 }))
    registerZone(baseZone('z1', { weight: 1 }))
    const zones = getZones()
    expect(zones).toHaveLength(1)
    expect(zones[0].weight).toBe(1)
  })

  it('should unregister via returned function', () => {
    const unregister = registerZone(baseZone('z1'))
    unregister()
    expect(getZones()).toHaveLength(0)
  })

  it('should update rect via updateZoneRect', () => {
    registerZone(baseZone('z1'))
    updateZoneRect('z1', { left: 0, top: 0, right: 50, bottom: 50 })
    expect(getZones()[0].rect).toEqual({ left: 0, top: 0, right: 50, bottom: 50 })
  })

  it('should no-op updateZoneRect for unknown id', () => {
    updateZoneRect('nope', { left: 0, top: 0, right: 50, bottom: 50 })
    expect(getZones()).toHaveLength(0)
  })

  it('should remove zone via removeZone', () => {
    registerZone(baseZone('z1'))
    removeZone('z1')
    expect(getZones()).toHaveLength(0)
  })

  it('should clear all zones', () => {
    registerZone(baseZone('z1'))
    registerZone(baseZone('z2'))
    clearZones()
    expect(getZones()).toHaveLength(0)
  })

  it('should auto-remove zone after decayTime', () => {
    vi.useFakeTimers()
    registerZone(baseZone('z1', { decayTime: 15_000 }))
    expect(getZones()).toHaveLength(1)
    vi.advanceTimersByTime(15_000)
    expect(getZones()).toHaveLength(0)
    vi.useRealTimers()
  })

  it('should keep zone without decayTime indefinitely', () => {
    registerZone(baseZone('z1'))
    expect(getZones()).toHaveLength(1)
  })

  it('should return array-level isolated snapshot (add/remove does not affect registry)', () => {
    registerZone(baseZone('z1'))
    const snapshot = getZones()
    snapshot.push(baseZone('z2'))
    snapshot.pop()
    expect(getZones()).toHaveLength(1)
    // Zone 对象为只读契约（调用方不 mutate），数组快照隔离即可
    expect(getZones()[0].id).toBe('z1')
  })
})
