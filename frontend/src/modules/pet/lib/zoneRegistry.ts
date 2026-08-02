/**
 * 区域注册表 — 管理 Zone 生命周期（注册/更新/移除）。
 * 普通模块单例（非 Zustand store）：Zone 是几何数据非 UI 状态，
 * 宠物侧在游走循环（低频）读取，无需响应式。
 */
import type { Zone } from '@daily-schedule/shared/pet'

const zones = new Map<string, Zone>()

/**
 * 注册 Zone；同 id 覆盖旧条目。
 * Zone 携带 decayTime 时自动定时衰减移除（吸引力随时间衰减）。
 * @returns 注销函数（调用后移除该 Zone，并清除衰减计时器）
 */
export function registerZone(zone: Zone): () => void {
  zones.set(zone.id, zone)

  let decayTimer: ReturnType<typeof setTimeout> | null = null
  if (zone.decayTime) {
    decayTimer = setTimeout(() => {
      zones.delete(zone.id)
    }, zone.decayTime)
  }

  return () => {
    if (decayTimer) clearTimeout(decayTimer)
    zones.delete(zone.id)
  }
}

/** 获取当前全部 Zone 快照 */
export function getZones(): Zone[] {
  return Array.from(zones.values())
}

/** 事件驱动更新 Zone 矩形（滚动/缩放后由调用方触发） */
export function updateZoneRect(id: string, rect: Zone['rect']): void {
  const zone = zones.get(id)
  if (zone) {
    zones.set(id, { ...zone, rect })
  }
}

/** 移除 Zone */
export function removeZone(id: string): void {
  zones.delete(id)
}

/** 清空全部 Zone（模块卸载时） */
export function clearZones(): void {
  zones.clear()
}
