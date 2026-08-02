import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { clearZones, getZones, registerZone } from '../../lib/zoneRegistry'
import { usePetStore } from '../../store/petStore'

vi.mock('../../hooks/usePet', () => ({
  useMyPet: () => ({ data: { id: 1, name: '豆豆', mood: 'happy', energy: 80 }, isLoading: false }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div data-mock-motion {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../PetSelection', () => ({
  PetSelection: () => null,
}))

import { RoamingPet } from '../RoamingPet'

const PET_ROOT = '[data-pet="roaming"]'

beforeEach(() => {
  clearZones()
  // 重置模块级 petStore（用例间共享，游走 tick 会修改 position）
  usePetStore.getState().reset()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('RoamingPet', () => {
  it('气泡不在翻转容器内（任何朝向文字正读）', () => {
    render(<RoamingPet />)

    // 结构断言：翻转容器只包裹宠物精灵，气泡默认不显示（无触发）
    const root = document.querySelector(PET_ROOT)!
    const flipContainer = root.querySelector('[style*="scaleX"]')
    expect(flipContainer).toBeTruthy() // 翻转容器存在（只包身体）
    const flipContainerHtml = flipContainer!.innerHTML
    expect(flipContainerHtml).not.toContain('pet-bubble') // 气泡不在其中
    expect(flipContainerHtml).not.toContain('PetStatus') // hover 浮窗也不在其中
  })

  it('鼠标停留 3s 后 50% 概率注册 user-interaction Zone', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // < 0.5 → 触发注册
    render(<RoamingPet />)

    expect(getZones()).toHaveLength(0)
    act(() => {
      fireEvent.mouseMove(document.body, { clientX: 500, clientY: 300 })
      vi.advanceTimersByTime(3000)
    })

    const zones = getZones()
    expect(zones).toHaveLength(1)
    expect(zones[0].type).toBe('user-interaction')
    expect(zones[0].rect).toMatchObject({ left: 440, top: 240, right: 560, bottom: 360 })
  })

  it('鼠标停留 3s 后 50% 概率之外不注册 Zone', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9) // >= 0.5 → 不触发
    render(<RoamingPet />)

    act(() => {
      fireEvent.mouseMove(document.body, { clientX: 500, clientY: 300 })
      vi.advanceTimersByTime(3000)
    })
    expect(getZones()).toHaveLength(0)
  })

  it('点击页面元素 30% 概率注册 Zone（排除宠物本体）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // < 0.3 → 触发
    render(<RoamingPet />)

    act(() => {
      fireEvent.pointerDown(document.body, { clientX: 200, clientY: 150 })
    })
    const zones = getZones()
    expect(zones).toHaveLength(1)
    expect(zones[0].type).toBe('user-interaction')
    expect(zones[0].rect).toMatchObject({ left: 140, top: 90, right: 260, bottom: 210 })
  })

  it('Zone 携带 decayTime 自动衰减移除', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    render(<RoamingPet />)

    act(() => {
      fireEvent.mouseMove(document.body, { clientX: 500, clientY: 300 })
      vi.advanceTimersByTime(3000)
    })
    expect(getZones()).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(15_000)
    })
    expect(getZones()).toHaveLength(0)
  })

  // ── 小窝进窝休息（pet-spot Zone）──
  // randomWanderInterval = 10_000 + Math.random() * 20_000；0.5 → 20s 第一 tick
  const HOME_RECT = { left: 0, top: 0, right: 200, bottom: 200 } // 覆盖初始 position {100,100}

  it('宠物进入 pet-spot Zone 自动进窝休息', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({ id: 'pet-home-spot', type: 'pet-spot', rect: HOME_RECT, weight: 1 })
    render(<RoamingPet />)

    expect(usePetStore.getState().isResting).toBe(false)
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(usePetStore.getState().isResting).toBe(true)
  })

  it('唤醒后 position 仍在小窝内时不立即再次进窝（边沿守卫）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({ id: 'pet-home-spot', type: 'pet-spot', rect: HOME_RECT, weight: 1 })
    render(<RoamingPet />)

    // 第一 tick 进窝
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(usePetStore.getState().isResting).toBe(true)

    // 用户交互唤醒（position 仍在窝内）→ 下一 tick 不得立即再次进窝
    act(() => {
      usePetStore.getState().wakeUp()
    })
    expect(usePetStore.getState().isResting).toBe(false)
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(usePetStore.getState().isResting).toBe(false)
  })

  it('2 分钟无交互 resting 时目标 = 小窝中心（zoneCenter）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // 小窝不覆盖初始 position {100,100} → 走 resting 分支
    registerZone({ id: 'pet-home-spot', type: 'pet-spot', rect: { left: 300, top: 300, right: 500, bottom: 500 }, weight: 1 })
    render(<RoamingPet />)

    act(() => {
      usePetStore.setState({ lastInteractionTime: Date.now() - 130_000 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    expect(usePetStore.getState().isResting).toBe(true)
    // 目标应为小窝几何中心 {400, 400}
    expect(usePetStore.getState().position).toMatchObject({ x: 400, y: 400 })
  })

  // ── 格内往返（calendar-cell 互动）──
  // 格子 {300,200,500,400}；Math.random=0.5 → fast interval=2000ms / slow interval=3750ms
  const CELL_RECT = { left: 300, top: 200, right: 500, bottom: 400 }

  it('进入 calendar-cell 格子后格内左右往返（完成度高 → happy + 快）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-01',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-01', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    // 把宠物移入格子中心 → 游走 tick 检测到进入 → 启动往返
    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    // 第一次往返：方向右 → 格子右缘内侧 x=480
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(usePetStore.getState().position).toMatchObject({ x: 480, y: 300 })
    expect(usePetStore.getState().emotionState).toBe('happy')

    // 第二次往返：方向左 → 格子左缘内侧 x=320
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(usePetStore.getState().position).toMatchObject({ x: 320, y: 300 })
  })

  it('完成度低 → 慢速 + 懒散情绪（idle_variant）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-02',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-02', completion: 20 },
      weight: 1,
    })
    render(<RoamingPet />)

    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    // 慢速 interval=3750ms：2s 时未移动（仍中心），3.75s 时移动
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(usePetStore.getState().position).toMatchObject({ x: 400, y: 300 })

    act(() => {
      vi.advanceTimersByTime(2_000) // 累计 4s > 3.75s → 第一次往返已执行
    })
    expect(usePetStore.getState().position.x).toBe(480)
    expect(usePetStore.getState().emotionState).toBe('idle_variant')
  })

  it('往返自动停止后同格子不立即重启（离开格子后可再次往返）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-03',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-03', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000) // 启动往返
    })

    // fast maxPaces=8 → 8 次往返后自动停止（9×2000ms）
    act(() => {
      vi.advanceTimersByTime(18_000)
    })
    const stoppedAt = usePetStore.getState().position

    // 往返已停止且同格子不立即重启：位置静止（不再 320↔480 交替）
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(usePetStore.getState().position).toEqual(stoppedAt)

    // 宠物离开格子（模拟游走目标出格）→ 游走 tick 重置防重启标记
    act(() => {
      usePetStore.getState().setPosition({ x: 800, y: 600 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    // 再次进入格子 → 可再次往返（最后一次 pace 目标 x=480）
    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(usePetStore.getState().position).toMatchObject({ x: 480, y: 300 })
  })

  it('进窝休息优先于格内往返（重叠区域不往返）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // 小窝与格子覆盖同一位置
    registerZone({ id: 'pet-home-spot', type: 'pet-spot', rect: CELL_RECT, weight: 1 })
    registerZone({
      id: 'calendar-cell-2026-08-04',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-04', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    // 进窝：isResting=true 且 position 稳定（不往返）
    expect(usePetStore.getState().isResting).toBe(true)
    const restingAt = usePetStore.getState().position
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(usePetStore.getState().position).toEqual(restingAt)
  })
})
