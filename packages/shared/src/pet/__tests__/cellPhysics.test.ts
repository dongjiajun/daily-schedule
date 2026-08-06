import { describe, it, expect } from 'vitest'
import {
  cellEdges,
  nextClingPoint,
  snapToEdge,
  applyGravity,
  hopOffset,
  createCellStyle,
  cellSessionDuration,
} from '../cellPhysics'

const RECT = { left: 100, top: 200, right: 300, bottom: 400 }

describe('cellEdges — 四边吸附点采样', () => {
  it('默认采样 10 点（上 3 下 3 左 2 右 2）', () => {
    const edges = cellEdges(RECT)
    expect(edges).toHaveLength(10)
    expect(edges.filter((e) => e.edge === 'top')).toHaveLength(3)
    expect(edges.filter((e) => e.edge === 'bottom')).toHaveLength(3)
    expect(edges.filter((e) => e.edge === 'left')).toHaveLength(2)
    expect(edges.filter((e) => e.edge === 'right')).toHaveLength(2)
  })

  it('吸附点在格内且内缩 margin', () => {
    const edges = cellEdges(RECT)
    for (const p of edges) {
      expect(p.x).toBeGreaterThan(RECT.left)
      expect(p.x).toBeLessThan(RECT.right)
      expect(p.y).toBeGreaterThan(RECT.top)
      expect(p.y).toBeLessThan(RECT.bottom)
    }
    // 底边点贴近底部（y = bottom - margin）
    const bottom = edges.find((e) => e.edge === 'bottom')!
    expect(bottom.y).toBeCloseTo(RECT.bottom - (RECT.bottom - RECT.top) * 0.15)
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
  it('选择最近未访问点', () => {
    const edges = cellEdges(RECT)
    const visited = new Set<typeof edges[number]>()
    // 从底边中点出发 → 最近是底边相邻点
    const first = nextClingPoint({ x: 200, y: 380 }, edges, visited)
    expect(first.edge).toBe('bottom')
    // 第二次调用不重复已访问点
    const second = nextClingPoint({ x: first.x, y: first.y }, edges, visited)
    expect(second).not.toBe(first)
    expect(visited.has(second)).toBe(true)
  })

  it('全部访问后清空重来', () => {
    const edges = cellEdges(RECT)
    const visited = new Set(edges)
    const next = nextClingPoint({ x: 200, y: 300 }, edges, visited)
    // visited 被清空后重新选择（能返回点）
    expect(visited.size).toBe(1)
    expect(edges).toContain(next)
  })
})

describe('snapToEdge — 吸附判定', () => {
  it('阈值内吸附到边线', () => {
    const edges = cellEdges(RECT)
    const near = { x: 200, y: RECT.bottom - 25 } // 距底边吸附点 5px（< 8px 阈值）
    const { pos, snapped } = snapToEdge(near, edges)
    expect(snapped).toBe(true)
    // 吸附到底边线（y = bottom - margin = 370）
    expect(pos.y).toBe(RECT.bottom - 30)
  })

  it('远离吸附点不吸附', () => {
    const edges = cellEdges(RECT)
    const far = { x: RECT.left + 50, y: RECT.top + 50 } // 格内左上远离所有边点
    const { pos, snapped } = snapToEdge(far, edges, 8)
    expect(snapped).toBe(false)
    expect(pos).toEqual(far)
  })
})

describe('applyGravity — 重力下沉', () => {
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

  it('<50 慢风格：25px/s + 不跳跃 + 长停留 + 贴底边 + idle_variant', () => {
    const style = createCellStyle(20)
    expect(style.walkSpeed).toBe(25)
    expect(style.hopChance).toBe(0)
    expect(style.clingDuration[1]).toBe(2000)
    expect(style.bottomOnly).toBe(true)
    expect(style.emotion).toBe('idle_variant')
  })

  it('会话时长：快 10s / 慢 15s', () => {
    expect(cellSessionDuration(80)).toBe(10_000)
    expect(cellSessionDuration(20)).toBe(15_000)
  })
})
