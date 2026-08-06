import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, screen } from '@testing-library/react'
import { clearZones, getZones, registerZone } from '../../lib/zoneRegistry'
import { usePetStore } from '../../store/petStore'

// 模块级常量 pet：引用稳定（贴近 React Query structural sharing——数据未变时 data 引用不变）
const MOCK_PET = { id: 1, name: '豆豆', mood: 'happy', energy: 80 }
vi.mock('../../hooks/usePet', () => ({
  useMyPet: () => ({ data: MOCK_PET, isLoading: false }),
  useInteract: () => ({ mutate: vi.fn(), isPending: false }),
  useShopItems: () => ({ data: [], isLoading: false }),
  usePurchase: () => ({ mutate: vi.fn(), isPending: false }),
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

  it('Zone 携带 decayTime（45s 保鲜期）到期后读取不可见', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    render(<RoamingPet />)

    act(() => {
      fireEvent.mouseMove(document.body, { clientX: 500, clientY: 300 })
      vi.advanceTimersByTime(3000)
    })
    expect(getZones()).toHaveLength(1)

    // 保鲜期内仍可见（15s < 45s）
    act(() => {
      vi.advanceTimersByTime(15_000)
    })
    expect(getZones()).toHaveLength(1)

    // 超过 45s 保鲜期 → 惰性过期
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(getZones()).toHaveLength(0)
  })

  // ── 渲染解耦（spec: Roam cadence survives re-render）──
  it('渲染不重排游走 timer（tick 节奏稳定，不被渲染清掉重排）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // wander interval = 20s
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    render(<RoamingPet />)

    // 第一 tick（20s）：scheduleWander 递归时清理旧 timer 恰 1 次
    // 若渲染触发 effect 重排（旧行为：tick 内 setPosition → 渲染 → cleanup 清 timer 重排），
    // clearTimeout 计数会多出 cleanup + 重排开头 2 次
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(clearSpy).toHaveBeenCalledTimes(1)

    // 第二 tick 在下一个 20s 执行（中间 22.5s idleVariant 递归清理 +1，40s 处第二 tick 递归清理 +1）
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(clearSpy).toHaveBeenCalledTimes(3)
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
    // 进窝即睡：sleep 动作（SVG 层闭眼+蜷缩+Zzz，无需 emotion）
    expect(usePetStore.getState().action).toBe('sleep')
  })

  it('hover 浮窗"回窝"按钮 → 立即回小窝睡觉', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({ id: 'pet-home-spot', type: 'pet-spot', rect: { left: 300, top: 300, right: 500, bottom: 500 }, weight: 1 })
    render(<RoamingPet />)
    usePetStore.getState().setPosition({ x: 100, y: 100 })

    // 悬停宠物出现浮窗
    act(() => {
      fireEvent.mouseEnter(document.querySelector('[data-pet="roaming"]')!.firstElementChild!)
    })
    act(() => {
      fireEvent.click(screen.getByText('😴 回窝'))
    })

    const s2 = usePetStore.getState()
    expect(s2.isResting).toBe(true)
    expect(s2.action).toBe('sleep')
    // 位置 = 小窝中心 {400, 400}
    expect(s2.position).toMatchObject({ x: 400, y: 400 })
  })

  it('移动 tick 设 walk 动作', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2) // tick 间隔 = 10s + 0.2×20s = 14s
    render(<RoamingPet />)

    act(() => {
      vi.advanceTimersByTime(14_000)
    })
    // 全域采样目标 != 初始 {100,100} → 移动中 = walk
    expect(usePetStore.getState().action).toBe('walk')
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

  it('进入 calendar-cell 格子后启动格内物理状态机（pace + happy + 落地）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // tick 间隔 20s；cling 停留 900ms
    registerZone({
      id: 'calendar-cell-2026-08-01',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-01', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    // 把宠物移入格子中心 → 游走 tick 检测到进入 → 启动格内状态机
    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    // 启动即 pace 动作 + happy 情绪（完成度 80 ≥ 50）
    expect(usePetStore.getState().action).toBe('pace')
    expect(usePetStore.getState().emotionState).toBe('happy')

    // rAF 帧推进：enter 阶段向格中心偏下移动（80px/s × 0.5s = 40px → y 300→330）
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const pos = usePetStore.getState().position
    expect(pos.x).toBeCloseTo(400, 0)
    expect(pos.y).toBeGreaterThan(300)
    // 位置始终在格子内
    expect(pos.x).toBeGreaterThanOrEqual(CELL_RECT.left)
    expect(pos.x).toBeLessThanOrEqual(CELL_RECT.right)
  })

  it('完成度低 → 懒散情绪 + 贴底边（bottomOnly 风格）', () => {
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
    expect(usePetStore.getState().emotionState).toBe('idle_variant')

    // 推进 3s：enter 落地 + cling 重力下沉 → 贴底边（y ≈ 400-30=370）
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    const pos = usePetStore.getState().position
    expect(pos.y).toBeGreaterThan(350) // 已下沉至底边附近
  })

  it('格内互动超时强制退出（恢复游走，同格子不立即重启）', () => {
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
      vi.advanceTimersByTime(20_000) // 启动格内互动
    })
    expect(usePetStore.getState().action).not.toBe('idle')

    // fast 会话上限 10s → 超时强制退出：action 回 idle，游走恢复
    act(() => {
      vi.advanceTimersByTime(11_000)
    })
    expect(usePetStore.getState().action).toBe('idle')
    expect(usePetStore.getState().emotionState).toBe('idle') // happy 定时同步到期

    // 下一个游走 tick（20s）：位置仍在格子内但同格子不立即重启（lastPacedCellRef）
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(usePetStore.getState().action).not.toBe('pace')
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
