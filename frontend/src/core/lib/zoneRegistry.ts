/**
 * 区域注册表 — 管理 Zone 生命周期（注册/更新/移除）。
 * 普通模块单例（非 Zustand store）：Zone 是几何数据非 UI 状态，
 * 宠物侧在游走循环（低频）读取，无需响应式。
 */
import type { Zone } from '@daily-schedule/shared/pet'

const zones = new Map<string, Zone>()

/**
 * 注册 Zone；同 id 覆盖旧条目。
 * Zone 携带 decayTime 时按"惰性过期"衰减：读取时（getZones）按 createdAt + decayTime
 * 过滤过期条目，不依赖 setTimeout 硬删——保证宠物在任意游走 tick 都能感知到未过期的 Zone
 * （保鲜期须覆盖最大 tick 间隔），且覆盖注册时不会残留旧衰减定时器误删新条目。
 * @returns 注销函数（调用后移除该 Zone）
 */
export function registerZone(zone: Zone): () => void {
  zones.set(zone.id, zone)

  return () => {
    zones.delete(zone.id)
  }
}

/** 获取当前全部 Zone 快照（惰性过期：读取时过滤并清理已过期的衰减 Zone） */
export function getZones(): Zone[] {
  const now = Date.now()
  const result: Zone[] = []
  for (const [id, z] of zones) {
    // decayTime 存在但 createdAt 缺失时视为不过期（防御性兼容）
    if (z.decayTime && z.createdAt && z.createdAt + z.decayTime <= now) {
      zones.delete(id)
    } else {
      result.push(z)
    }
  }
  return result
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
