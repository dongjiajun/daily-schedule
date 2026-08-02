/**
 * 宠物游走引擎 — 纯逻辑，无平台依赖。
 * Web (framer-motion) 和小程序 (Canvas) 共享。
 */

// ── 类型定义 ─────────────────────────────────────────────

export interface Position {
  x: number
  y: number
}

export interface RoamingConfig {
  /** 视口尺寸 */
  viewport: { width: number; height: number }
  /** 需要避让的矩形区域（如日历网格 .rbc-month-view） */
  avoidZones: AvoidZone[]
  /** 预设休息点 */
  restingSpots: Position[]
  /** 安全边距（距视口边缘的距离） */
  padding: number
}

export interface AvoidZone {
  /** 矩形边界（相对于视口） */
  rect: { left: number; top: number; right: number; bottom: number }
  /** 避让强度: "soft" 降低概率但仍可能进入，"hard" 完全禁止进入 */
  strength: 'soft' | 'hard'
}

/** 区域类型：user-interaction（用户交互）/ pet-spot（宠物专属区域）/ calendar-cell（日历格子） */
export type ZoneType = 'user-interaction' | 'pet-spot' | 'calendar-cell'

/** calendar-cell Zone 的完成度负载：当天日程完成度 */
export interface CalendarCellPayload {
  /** 日期标识（YYYY-MM-DD） */
  date: string
  /** 当天完成度百分比（0-100 整数，COMPLETED / total） */
  completion: number
}

/**
 * 各 Zone 类型的数据负载结构。
 * 编译期约束：calendar-cell 必须携带完成度；其余类型无负载。
 */
export type ZonePayload = {
  'user-interaction': undefined
  'pet-spot': undefined
  'calendar-cell': CalendarCellPayload
}

/**
 * 类型化区域（Zone）— 替代原 InterestPoint。
 * 矩形 + 类型 + 数据负载，供区域感知机制消费。
 */
export interface Zone<T extends ZoneType = ZoneType> {
  id: string
  type: T
  /** 矩形边界（相对于视口） */
  rect: { left: number; top: number; right: number; bottom: number }
  /** 数据负载（按类型收紧：calendar-cell 携带完成度，其余无） */
  payload?: ZonePayload[T]
  /** 吸引力权重 (0-1) */
  weight: number
  /** ms 后吸引力衰减至 0 的时间 */
  decayTime?: number
  createdAt?: number
}

export type RoamingMode = 'wandering' | 'attracted' | 'resting' | 'idle'

// ── 常量 ─────────────────────────────────────────────────

const DEFAULT_PADDING = 20
const ATTRACTION_DISTANCE = 100 // px, 宠物靠近兴趣点的最近距离
const RESTING_INTERVAL = 2 * 60 * 1000 // 2min 无交互后进入休息
const WANDER_INTERVAL_MIN = 10_000
const WANDER_INTERVAL_MAX = 30_000
const MOVE_DURATION_MIN = 3_000
const MOVE_DURATION_MAX = 8_000

// ── 工具函数 ─────────────────────────────────────────────

/** clamp 值到范围 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 生成范围内的随机数 */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

// ── 核心算法 ─────────────────────────────────────────────

/**
 * 将坐标 clamp 到视口安全区域内。
 */
export function clampToViewport(pos: Position, config: RoamingConfig): Position {
  const { viewport, padding } = config
  return {
    x: clamp(pos.x, padding, viewport.width - padding),
    y: clamp(pos.y, padding, viewport.height - padding),
  }
}

/**
 * 判断点是否在给定矩形内。
 */
export function isInsideRect(pos: Position, rect: { left: number; top: number; right: number; bottom: number }): boolean {
  return pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom
}

/**
 * 避让区域处理：如果目标点在硬避让区内，移动到最近的合法位置。
 */
export function avoidZones(pos: Position, zones: AvoidZone[]): Position {
  let result = { ...pos }
  let iterations = 0
  let changed = true

  while (changed && iterations < 10) {
    changed = false
    iterations++
    let adjusted = false

    for (const zone of zones) {
      if (zone.strength !== 'hard') continue
      if (isInsideRect(result, zone.rect)) {
        // 推向最近的边界外侧
        const distToLeft = result.x - zone.rect.left
        const distToRight = zone.rect.right - result.x
        const distToTop = result.y - zone.rect.top
        const distToBottom = zone.rect.bottom - result.y

        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

        if (minDist === distToLeft) {
          result = { ...result, x: zone.rect.left - 10 }
        } else if (minDist === distToRight) {
          result = { ...result, x: zone.rect.right + 10 }
        } else if (minDist === distToTop) {
          result = { ...result, y: zone.rect.top - 10 }
        } else {
          result = { ...result, y: zone.rect.bottom + 10 }
        }
        adjusted = true
        changed = true
        break
      }
    }

    if (!adjusted) break
  }

  return result
}

/**
 * 是否在软避让区域内（降低概率）。
 */
export function isInSoftZone(pos: Position, zones: AvoidZone[]): boolean {
  return zones.some(z => z.strength === 'soft' && isInsideRect(pos, z.rect))
}

// ── 游走模式计算 ─────────────────────────────────────────

/**
 * 确定游走模式。
 */
export function determineMode(params: {
  lastInteractionAt: number
  hasActiveZone: boolean
  isNightTime: boolean
}): RoamingMode {
  const { lastInteractionAt, hasActiveZone, isNightTime } = params
  const now = Date.now()
  const idleDuration = now - lastInteractionAt

  if (isNightTime && idleDuration > RESTING_INTERVAL) return 'resting'
  if (hasActiveZone) return 'attracted'
  if (idleDuration > RESTING_INTERVAL) return 'resting'
  return 'wandering'
}

/**
 * 随机漫步：生成随机目标点，避开硬避让区。
 * soft 权重化（Decision 8）：30% 概率全域采样（保证视口覆盖）+ 70% 局部漂移（自然漫游）；
 * 目标落入 soft 避让区时 50% 概率接受——soft 是降频区而非排斥墙，消除方向性边缘排斥。
 */
export function computeWanderTarget(current: Position, config: RoamingConfig): Position {
  const { viewport, padding } = config
  const softZones = config.avoidZones.filter(z => z.strength === 'soft')
  const sampleTarget = (): Position => {
    // 30% 全域采样（覆盖视口任意位置）/ 70% 以当前位置为中心的局部漂移
    if (Math.random() < 0.3) {
      return {
        x: randomRange(padding, viewport.width - padding),
        y: randomRange(padding, viewport.height - padding),
      }
    }
    return {
      x: clamp(current.x + (Math.random() - 0.5) * 400, padding, viewport.width - padding),
      y: clamp(current.y + (Math.random() - 0.5) * 300, padding, viewport.height - padding),
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = sampleTarget()

    // 硬避让区完全拒绝
    const clamped = avoidZones(candidate, config.avoidZones)
    if (clamped.x !== candidate.x || clamped.y !== candidate.y) continue

    // soft 区：50% 概率接受（降频而非排斥）
    if (isInSoftZone(clamped, softZones) && Math.random() < 0.5) continue

    return clamped
  }

  // fallback: 全域采样（hard 推出）
  return avoidZones(
    {
      x: randomRange(padding, viewport.width - padding),
      y: randomRange(padding, viewport.height - padding),
    },
    config.avoidZones
  )
}

/**
 * 兴趣点吸引：向兴趣点靠近 ATTRACTION_DISTANCE 的位置。
 */
export function computeAttractedTarget(
  current: Position,
  interestPoint: Position,
  config: RoamingConfig
): Position {
  const dx = interestPoint.x - current.x
  const dy = interestPoint.y - current.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist <= ATTRACTION_DISTANCE) {
    // 已经在足够近的位置，细微偏移避免重叠
    return clampToViewport({
      x: interestPoint.x + randomRange(-30, 30),
      y: interestPoint.y + randomRange(-30, 30),
    }, config)
  }

  // 向兴趣点方向移动
  const ratio = ATTRACTION_DISTANCE / dist
  const target = clampToViewport({
    x: interestPoint.x - dx * ratio,
    y: interestPoint.y - dy * ratio,
  }, config)

  return avoidZones(target, config.avoidZones)
}

/**
 * 休息点选择：选择最近的休息点。
 */
export function computeRestingTarget(current: Position, restingSpots: Position[]): Position {
  if (restingSpots.length === 0) return current

  let nearest = restingSpots[0]
  let minDist = Infinity

  for (const spot of restingSpots) {
    const dx = spot.x - current.x
    const dy = spot.y - current.y
    const dist = dx * dx + dy * dy
    if (dist < minDist) {
      minDist = dist
      nearest = spot
    }
  }

  return nearest
}

/**
 * 计算 Zone 的几何中心。
 */
export function zoneCenter(zone: Zone): Position {
  return {
    x: (zone.rect.left + zone.rect.right) / 2,
    y: (zone.rect.top + zone.rect.bottom) / 2,
  }
}

/**
 * 游走主入口：根据模式计算下一个目标位置。
 */
export function computeNextTarget(
  current: Position,
  config: RoamingConfig,
  mode: RoamingMode,
  options?: {
    /** 活跃区域（attracted 模式使用） */
    activeZone?: Zone
  }
): Position {
  switch (mode) {
    case 'wandering':
      return computeWanderTarget(current, config)

    case 'attracted': {
      const zone = options?.activeZone
      if (!zone) return computeWanderTarget(current, config)

      const center = zoneCenter(zone)
      // Zone 位于 hard 避让区内 → 放弃吸引，退回 wandering
      const inHardZone = config.avoidZones.some(
        z => z.strength === 'hard' && isInsideRect(center, z.rect)
      )
      if (inHardZone) return computeWanderTarget(current, config)

      return computeAttractedTarget(current, center, config)
    }

    case 'resting':
      return computeRestingTarget(current, config.restingSpots)

    case 'idle':
    default:
      return current
  }
}

/**
 * 生成随机游走间隔 (ms)。
 */
export function randomWanderInterval(): number {
  return randomRange(WANDER_INTERVAL_MIN, WANDER_INTERVAL_MAX)
}

/**
 * 生成随机移动时长 (ms)。
 * @param speedMultiplier 情绪影响：happy=1.5 (更快), sad=0.5 (更慢), default=1
 */
export function randomMoveDuration(speedMultiplier = 1): number {
  const raw = randomRange(MOVE_DURATION_MIN, MOVE_DURATION_MAX)
  return raw / Math.max(0.3, speedMultiplier)
}

/**
 * 计算当前面向方向。
 */
export function computeFacing(currentX: number, targetX: number): 'left' | 'right' {
  return targetX >= currentX ? 'right' : 'left'
}

// ── 工厂函数 ─────────────────────────────────────────────

/**
 * 创建默认配置。
 */
export function createDefaultConfig(viewportWidth: number, viewportHeight: number): RoamingConfig {
  return {
    viewport: { width: viewportWidth, height: viewportHeight },
    avoidZones: [],
    restingSpots: [
      { x: viewportWidth - 80, y: viewportHeight - 80 },  // 右下角
      { x: 80, y: viewportHeight - 80 },                    // 左下角
      { x: viewportWidth - 80, y: 100 },                    // 右上角
    ],
    padding: DEFAULT_PADDING,
  }
}
