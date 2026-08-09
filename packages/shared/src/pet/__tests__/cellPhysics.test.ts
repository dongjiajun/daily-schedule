import { describe, it, expect } from 'vitest'
import {
  cellEdges,
  nextClingPoint,
  snapToEdge,
  applyGravity,
  hopOffset,
  createCellStyle,
  landSnap,
  slideInSpeed,
  cellLapTarget,
  CELL_MAX_SESSION_MS,
} from '../cellPhysics'

const RECT = { left: 100, top: 200, right: 300, bottom: 400 }

describe('cellEdges — 四边吸附点采样（14 点含四角）', () => {
  it('默认采样 14 点（含四角，角点 edge 归"进入该角的边"）', () => {
    const edges = cellEdges(RECT)
    expect(edges).toHaveLength(14)
    // 各边点数 = 边点 + 离开该边的角点：bottom 3+左下角、right 2+右下角+右上角、top 3、left 2+左上角
    expect(edges.filter((e) => e.edge === 'bottom')).toHaveLength(4)
    expect(edges.filter((e) => e.edge === 'right')).toHaveLength(4)
    expect(edges.filter((e) => e.edge === 'top')).toHaveLength(3)
    expect(edges.filter((e) => e.edge === 'left')).toHaveLength(3)
  })

  it('边顺序为顺时针绕圈（角点 edge 归"离开边"：转弯段贴线不越界）', () => {
    const edges = cellEdges(RECT)
    const order = edges.map((e) => e.edge)
    expect(order.slice(0, 3)).toEqual(['bottom', 'bottom', 'bottom'])
    expect(order[3]).toBe('right') // 右下角（离开边 = 右壁：横躺滑入角）
    expect(order.slice(4, 6)).toEqual(['right', 'right'])
    expect(order[6]).toBe('right') // 右上角（离开边 = 右壁：保持横躺至顶边）
    expect(order.slice(7, 10)).toEqual(['top', 'top', 'top'])
    expect(order[10]).toBe('left') // 左上角（离开边 = 左壁：横躺过渡）
    expect(order.slice(11, 13)).toEqual(['left', 'left'])
    expect(order[13]).toBe('bottom') // 左下角（离开边 = 底边：站姿过渡）
  })

  it('任意相邻吸附点都在同一边或紧邻角点（不斜穿格内：x 或 y 至少一个相等）', () => {
    const edges = cellEdges(RECT)
    for (let i = 0; i < edges.length; i++) {
      const a = edges[i]
      const b = edges[(i + 1) % edges.length]
      expect(a.x === b.x || a.y === b.y).toBe(true)
    }
  })

  it('角点位于两条边的内缩交点', () => {
    const edges = cellEdges(RECT)
    const [br] = edges.slice(3, 4)
    expect(br.x).toBeCloseTo(RECT.right - (RECT.right - RECT.left) * 0.06)
    expect(br.y).toBeCloseTo(RECT.bottom - (RECT.bottom - RECT.top) * 0.06)
  })

  it('吸附点在格内且内缩 margin', () => {
    const edges = cellEdges(RECT)
    for (const p of edges) {
      expect(p.x).toBeGreaterThan(RECT.left)
      expect(p.x).toBeLessThan(RECT.right)
      expect(p.y).toBeGreaterThan(RECT.top)
      expect(p.y).toBeLessThan(RECT.bottom)
    }
    // 底边点贴近底部（y = bottom - margin，内缩 6%）
    const bottom = edges.find((e) => e.edge === 'bottom')!
    expect(bottom.y).toBeCloseTo(RECT.bottom - (RECT.bottom - RECT.top) * 0.06)
  })

  it('bottomOnly 仅底边 + 侧边下半（5 点）', () => {
    const edges = cellEdges(RECT, true)
    expect(edges).toHaveLength(5)
    expect(edges.filter((e) => e.edge === 'top')).toHaveLength(0)
    expect(edges.filter((e) => e.edge === 'bottom')).toHaveLength(3)
    // 侧边点位于下半部
    for (const e of edges.filter((e) => e.edge !== 'bottom')) {
      expect(e.y).toBeGreaterThan(RECT.top + (RECT.bottom - RECT.top) * 0.5)
    }
  })
})

describe('nextClingPoint — 绕边不回头', () => {
  it('沿边顺序绕圈（含四边与角点），不回头', () => {
    const edges = cellEdges(RECT)
    const visited = new Set<typeof edges[number]>()
    const first = nextClingPoint({ x: 200, y: 380 }, edges, visited)
    expect(first.edge).toBe('bottom')
    // 后续沿边顺序推进：14 点绕完一轮
    const seenOrder: string[] = [first.edge]
    let cur = { x: first.x, y: first.y }
    for (let i = 0; i < 13; i++) {
      const next = nextClingPoint(cur, edges, visited)
      seenOrder.push(next.edge)
      cur = { x: next.x, y: next.y }
    }
    // 绕圈顺序包含全部四边（不只底边）——顶边可达
    expect(new Set(seenOrder)).toEqual(new Set(['bottom', 'right', 'top', 'left']))
  })

  it('全部访问后清空重来', () => {
    const edges = cellEdges(RECT)
    const visited = new Set(edges)
    const next = nextClingPoint({ x: 200, y: 300 }, edges, visited)
    expect(visited.size).toBe(1)
    expect(edges).toContain(next)
  })
})

describe('snapToEdge — 吸附判定', () => {
  it('阈值内吸附到边线', () => {
    const edges = cellEdges(RECT)
    const near = { x: 200, y: RECT.bottom - 15 } // 距底边吸附点 3px（< 8px 阈值）
    const { pos, snapped } = snapToEdge(near, edges)
    expect(snapped).toBe(true)
    expect(pos.y).toBe(RECT.bottom - 12)
  })

  it('远离吸附点不吸附', () => {
    const edges = cellEdges(RECT)
    const far = { x: RECT.left + 50, y: RECT.top + 50 } // 格内左上远离所有边点
    const { pos, snapped } = snapToEdge(far, edges, 8)
    expect(snapped).toBe(false)
    expect(pos).toEqual(far)
  })
})

describe('landSnap — 落地水平对齐', () => {
  it('对齐到最近底边吸附点的 x', () => {
    const edges = cellEdges(RECT)
    // (200, 300) 距底边中点 (200, 370) 最近
    const snap = landSnap({ x: 200, y: 300 }, edges)
    expect(snap.x).toBe(200) // 底边中点 x=200
    expect(snap.y).toBe(300) // y 保持不变
  })

  it('对齐到最近底边吸附点（偏离中点时）', () => {
    const edges = cellEdges(RECT)
    const snap = landSnap({ x: 250, y: 380 }, edges)
    // 距 b2（x=250）最近
    expect(snap.x).toBe(250)
  })
})

describe('slideInSpeed — 吸附滑入加速', () => {
  it('距目标 < 12px 加速 ×1.6', () => {
    expect(slideInSpeed(60, 8)).toBe(96)
    expect(slideInSpeed(25, 5)).toBe(40)
  })

  it('远离目标保持原速', () => {
    expect(slideInSpeed(60, 20)).toBe(60)
    expect(slideInSpeed(60, 12)).toBe(60)
  })
})

describe('applyGravity — 重力下沉（仅落地阶段）', () => {
  it('y 向底边 lerp', () => {
    const pos = { x: 200, y: 300 }
    const next = applyGravity(pos, RECT, 30)
    expect(next.y).toBeGreaterThan(pos.y)
    expect(next.y).toBeLessThanOrEqual(RECT.bottom - 30)
  })

  it('已达底边不再下沉', () => {
    const pos = { x: 200, y: RECT.bottom - 30 }
    const next = applyGravity(pos, RECT, 30)
    expect(next.y).toBe(RECT.bottom - 30)
  })
})

describe('hopOffset — sin 跳跃曲线', () => {
  it('t=0 与 t=1 偏移为 0', () => {
    expect(hopOffset(0)).toBeCloseTo(0)
    expect(hopOffset(1)).toBeCloseTo(0)
  })

  it('t=0.5 达到最大离地高度', () => {
    expect(hopOffset(0.5)).toBe(-10)
  })

  it('t 越界钳制', () => {
    expect(hopOffset(1.5)).toBeCloseTo(0)
    expect(hopOffset(-0.2)).toBeCloseTo(0)
  })
})

describe('createCellStyle — 完成度风格', () => {
  it('≥50 快风格：60px/s + 40% 跳跃 + 短停留 + 绕圈 + happy', () => {
    const style = createCellStyle(80)
    expect(style.walkSpeed).toBe(60)
    expect(style.hopChance).toBe(0.4)
    expect(style.clingDuration[0]).toBe(600)
    expect(style.bottomOnly).toBe(false)
    expect(style.emotion).toBe('happy')
  })

  it('<50 慢风格：25px/s + 不跳跃 + 长停留 + idle_variant（同样绕四边）', () => {
    const style = createCellStyle(20)
    expect(style.walkSpeed).toBe(25)
    expect(style.hopChance).toBe(0)
    expect(style.clingDuration[1]).toBe(2000)
    expect(style.bottomOnly).toBe(false) // 慢风格也绕完整四边（顶边/倒立可见）
    expect(style.emotion).toBe('idle_variant')
  })
})

describe('圈数退出与兜底', () => {
  it('2 圈阈值 = ceil(2 × 点数)', () => {
    expect(cellLapTarget(14)).toBe(28)
    expect(cellLapTarget(5)).toBe(10)
  })

  it('兜底上限 45s（须 > 大格子 2 圈 ~37s，防提前踢出）', () => {
    expect(CELL_MAX_SESSION_MS).toBe(45_000)
  })
})
