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

  it('完成度低 → 懒散情绪（慢风格，绕四边）', () => {
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

    // 推进 3s：enter 落地 + 重力下沉 → 贴底边（盒子坐标 y ≈ 400-12-64=324）
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    const pos = usePetStore.getState().position
    expect(pos.y).toBeGreaterThan(300) // 已下沉至底边附近（脚踩边线）
  })

  // ── 贴壁旋转（锚点 + 姿态）──
  it('格内绕行出现完整贴壁姿态（底站 / 右横 -90 / 左横 +90 / 顶倒立 180）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-06',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-06', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000) // 启动格内互动
    })

    // 大步进推进帧循环（500ms/步，25s 兜底内走完至少一轮 14 点），收集翻转容器全部 rotate 姿态
    const seen = new Set<string>()
    for (let i = 0; i < 120; i++) {
      act(() => {
        vi.advanceTimersByTime(500)
      })
      document.querySelectorAll('[data-pet="roaming"] [style*="rotate"]').forEach((el) => {
        const style = (el as HTMLElement).getAttribute('style') || ''
        const m = style.match(/rotate\((-?\d+)deg\)/)
        if (m) seen.add(m[1])
      })
    }
    // 贴四边姿态：右壁 -90 / 左壁 90 / 顶边 180（底边无 rotate）
    expect(seen.has('-90')).toBe(true)
    expect(seen.has('90')).toBe(true)
    expect(seen.has('180')).toBe(true)
  })

  it('贴壁姿态位置精确：脚底贴合所贴边线（右壁 x / 左壁 x / 顶边 y）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-08',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-08', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)
    act(() => { usePetStore.getState().setPosition({ x: 400, y: 300 }) })
    act(() => { vi.advanceTimersByTime(20_000) })

    // 格子边线（内缩 6%）：右 488 / 左 312 / 顶 212（CELL_RECT 300,200,500,400）
    const RIGHT_LINE = 500 - 12
    const LEFT_LINE = 300 + 12
    const TOP_LINE = 200 + 12

    // 收集各姿态段的 position，断言脚底（姿态偏移）贴合边线
    const rightSamples: number[] = []
    const leftSamples: number[] = []
    const topSamples: number[] = []
    for (let i = 0; i < 64; i++) {
      act(() => { vi.advanceTimersByTime(500) })
      const pos = usePetStore.getState().position
      const flipEl = document.querySelector('[data-pet="roaming"] [style*="scaleX"]')
      const style = flipEl ? (flipEl as HTMLElement).getAttribute('style') || '' : ''
      const rot = (style.match(/rotate\((-?\d+)deg\)/) || [])[1] ?? '0'
      if (rot === '-90') rightSamples.push(pos.x + 64) // 右壁：脚底 = x + 64
      if (rot === '90') leftSamples.push(pos.x + 26) // 左壁：脚底 = x + 26
      if (rot === '180') topSamples.push(pos.y + 26) // 顶边：脚底 = y + 26
    }
    expect(rightSamples.length).toBeGreaterThan(0)
    expect(leftSamples.length).toBeGreaterThan(0)
    expect(topSamples.length).toBeGreaterThan(0)
    // 契约：行走段（脚底接近边线 <2px）精确贴合（±1px）；转弯滑入末端（姿态切换）不在此列
    const nearRight = rightSamples.filter((f) => Math.abs(f - RIGHT_LINE) < 2)
    const nearLeft = leftSamples.filter((f) => Math.abs(f - LEFT_LINE) < 2)
    const nearTop = topSamples.filter((f) => Math.abs(f - TOP_LINE) < 2)
    expect(nearRight.length).toBeGreaterThan(0)
    expect(nearLeft.length).toBeGreaterThan(0)
    expect(nearTop.length).toBeGreaterThan(0)
    for (const foot of nearRight) expect(foot).toBeCloseTo(RIGHT_LINE, 0)
    for (const foot of nearLeft) expect(foot).toBeCloseTo(LEFT_LINE, 0)
    for (const foot of nearTop) expect(foot).toBeCloseTo(TOP_LINE, 0)
  })

  it('贴壁段 facing 稳定（无镜像翻转：右壁段不反复左右切换）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-09',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-09', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)
    act(() => { usePetStore.getState().setPosition({ x: 400, y: 300 }) })
    act(() => { vi.advanceTimersByTime(20_000) })

    // 收集右壁段（rot=-90）的 flip：必须恒 R（无镜像）
    const flips = new Set<string>()
    for (let i = 0; i < 64; i++) {
      act(() => { vi.advanceTimersByTime(500) })
      const flipEl = document.querySelector('[data-pet="roaming"] [style*="scaleX"]')
      const style = flipEl ? (flipEl as HTMLElement).getAttribute('style') || '' : ''
      const rot = (style.match(/rotate\((-?\d+)deg\)/) || [])[1] ?? '0'
      if (rot === '-90') flips.add(style.includes('scaleX(-1)') ? 'L' : 'R')
    }
    expect(flips.size).toBeGreaterThan(0)
    expect(flips.has('L')).toBe(false) // 右壁段不允许镜像翻转
  })

  it('贴壁位置锚定：宠物脚底（盒子+偏移）贴合所贴边线', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    registerZone({
      id: 'calendar-cell-2026-08-07',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-07', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000) // 启动格内互动
    })

    // 推进到落地（脚踩底边）：底边线盒子坐标 = 400-12-64 = 324
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    const grounded = usePetStore.getState().position
    expect(grounded.y).toBeCloseTo(324, 0)
  })

  it('绕行 2 圈自然退出（28 步，<35s 兜底）+ 恢复游走不同格子不立即重启', () => {
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

    // 2 圈 28 步 ≈ 37s（200×200 测试格子）< 45s 兜底 → 按圈自然退出：action 回 idle（证明非兜底截断）
    act(() => {
      vi.advanceTimersByTime(38_000) // 绕行 38s > 37s 按圈完成（< 45s 兜底）
    })
    expect(usePetStore.getState().action).toBe('idle')
    // 情绪断言省略：happy 情绪时长 = 45s 兜底，退出后尚未到期（idleVariantTimer 也可能已覆盖）

    // 下一个游走 tick（20s）：位置仍在格子内但同格子不立即重启（lastPacedCellRef）
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(usePetStore.getState().action).not.toBe('pace')
  })

  it('落地后 cling 位置稳定（不再被重力拖向底部）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // cling 停留 900ms
    registerZone({
      id: 'calendar-cell-2026-08-05',
      type: 'calendar-cell',
      rect: CELL_RECT,
      payload: { date: '2026-08-05', completion: 80 },
      weight: 1,
    })
    render(<RoamingPet />)

    act(() => {
      usePetStore.getState().setPosition({ x: 400, y: 300 })
    })
    act(() => {
      vi.advanceTimersByTime(20_000) // 启动格内状态机
    })
    // enter 落向底边吸附点正上方（384ms）→ landing 重力下落（目标 y=330→324 仅 6px，~50ms）→ bounce 4 帧 → cling（~500ms 起，停留 900ms）
    // 1000ms 时已过 bounce，处于 cling 窗口内（~500ms-1400ms）
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    const settled = usePetStore.getState().position
    expect(settled.y).toBeCloseTo(324, 0) // 底边线盒子坐标（400 - 12 margin - 64 脚高）：脚踩边线

    // cling 停留期间位置完全稳定：不漂移、不上下滑（1200ms 仍在 cling 窗口内）
    act(() => {
      vi.advanceTimersByTime(200)
    })
    const stable = usePetStore.getState().position
    expect(stable.y).toBe(settled.y)
    expect(stable.x).toBe(settled.x)
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
