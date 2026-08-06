import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { PetAvatar } from './PetAvatar'
import { PetBubble } from './PetBubble'
import { PetStatus } from './PetStatus'
import { PetSelection } from './PetSelection'
import { PetMenu } from './PetMenu'
import { ParticleBurst } from './ParticleBurst'
import { FloatingText } from './FloatingText'
import {
  determineMode,
  computeNextTarget,
  computeFacing,
  randomWanderInterval,
  randomMoveDuration,
  createDefaultConfig,
  isInsideRect,
  zoneCenter,
  cellEdges,
  nextClingPoint,
  applyGravity,
  hopOffset,
  createCellStyle,
  cellSessionDuration,
  randomRange,
} from '@daily-schedule/shared/pet'
import type { RoamingConfig, AvoidZone, Zone, CalendarCellPayload, Position, CellClingPoint, CellStyle } from '@daily-schedule/shared/pet'
import { registerZone, getZones } from '../lib/zoneRegistry'

/** 匀速移动一步（dt 毫秒），不超过目标 */
function moveToward(current: Position, target: Position, speed: number, dt: number): Position {
  const dx = target.x - current.x
  const dy = target.y - current.y
  const dist = Math.hypot(dx, dy)
  const step = (speed * dt) / 1000
  if (dist <= step) return { ...target }
  const ratio = step / dist
  return { x: current.x + dx * ratio, y: current.y + dy * ratio }
}

/**
 * 游走宠物 — 替代 PetPanel 的 v2 角色式宠物。
 * - 以独立精灵在页面自由漫步
 * - pointer-events: none 穿透
 * - 点击摸头 / 双击玩耍
 * - Hover 显示迷你状态浮窗
 */
export function RoamingPet() {
  const { data: pet, isLoading, isError, isFetching } = useMyPet()
  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)

  const position = usePetStore((s) => s.position)
  const setPosition = usePetStore((s) => s.setPosition)
  const facing = usePetStore((s) => s.facing)
  const setFacing = usePetStore((s) => s.setFacing)
  const isResting = usePetStore((s) => s.isResting)
  const startResting = usePetStore((s) => s.startResting)
  const wakeUp = usePetStore((s) => s.wakeUp)
  const setEmotion = usePetStore((s) => s.setEmotion)
  const setAction = usePetStore((s) => s.setAction)
  const showBubble = usePetStore((s) => s.showBubble)

  const [hovered, setHovered] = useState(false)

  const particleTrigger = usePetStore((s) => s.particleTrigger)
  const clearParticleTrigger = usePetStore((s) => s.clearParticleTrigger)
  const feedbackTrigger = usePetStore((s) => s.feedbackTrigger)
  const clearFeedback = usePetStore((s) => s.clearFeedback)

  const [menuOpen, setMenuOpen] = useState(false)
  /** 格内当前贴的边（贴壁旋转：左/右壁形象横过来） */
  const [clingEdge, setClingEdge] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null)

  const configRef = useRef<RoamingConfig>(createDefaultConfig(window.innerWidth, window.innerHeight))
  const wanderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleVariantTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 进窝边沿守卫：记录上一 tick 是否在小窝内，仅"进入边沿"才触发进窝休息
  const wasInHomeRef = useRef(false)

  // ── 格内物理状态机（calendar-cell 互动，rAF 帧循环） ──
  const cellPhysicsRef = useRef<{
    rafId: number | null
    zone: Zone
    style: CellStyle
    state: 'enter' | 'cling' | 'walk' | 'hop'
    current: Position
    target: CellClingPoint | null
    landY: number
    edges: CellClingPoint[]
    visited: Set<CellClingPoint>
    clingUntil: number
    hopStart: number
    sessionStart: number
  } | null>(null)
  /** 最近一次格内互动的格子（同格子不重复互动，须先离开才可再次） */
  const lastPacedCellRef = useRef<string | null>(null)
  const [pacingCellId, setPacingCellId] = useState<string | null>(null)

  // ── 初始化视口配置 ──
  useEffect(() => {
    const handleResize = () => {
      configRef.current = createDefaultConfig(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── 更新避让区（日历网格） ──
  const updateAvoidZones = useCallback(() => {
    const zones: AvoidZone[] = []
    const calendarGrid = document.querySelector('.rbc-month-view')
    if (calendarGrid) {
      const rect = calendarGrid.getBoundingClientRect()
      zones.push({
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
        strength: 'soft',
      })
    }
    configRef.current = { ...configRef.current, avoidZones: zones }
  }, [])

  useEffect(() => {
    updateAvoidZones()
    // 只监听日历网格所在容器（替代全 body subtree 监听，避免 layout thrash）
    const grid = document.querySelector('.rbc-month-view')
    let gridObserver: MutationObserver | null = null
    if (grid?.parentElement) {
      gridObserver = new MutationObserver(updateAvoidZones)
      gridObserver.observe(grid.parentElement, { childList: true, subtree: true })
    }
    // 滚动/缩放事件驱动 rect 更新（scroll capture 捕获容器内滚动）
    const refresh = () => updateAvoidZones()
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      gridObserver?.disconnect()
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
    }
  }, [updateAvoidZones])

  // ── 兴趣区域接线（spec: Interest Point Attraction 的 UI 层实现） ──
  // 鼠标停留 > 3s → 50% 概率创建兴趣区域；点击/输入 → 30% 概率
  useEffect(() => {
    let dwellTimer: ReturnType<typeof setTimeout> | null = null
    let dwellPos: { x: number; y: number } | null = null

    const makeZone = (x: number, y: number): Zone => ({
      id: `user-interaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'user-interaction',
      rect: { left: x - 60, top: y - 60, right: x + 60, bottom: y + 60 },
      weight: 1,
      // 保鲜期 > 最大游走 tick（30s）+ 移动时长（8s）余量：任意 tick 都能感知到未过期的兴趣区
      // 衰减判定在读取时惰性执行（zoneRegistry.getZones），到期后下一 tick 自然消失
      decayTime: 45_000,
      createdAt: Date.now(),
    })

    const handleMouseMove = (e: MouseEvent) => {
      dwellPos = { x: e.clientX, y: e.clientY }
      if (dwellTimer) clearTimeout(dwellTimer)
      dwellTimer = setTimeout(() => {
        if (dwellPos && Math.random() < 0.5) {
          registerZone(makeZone(dwellPos.x, dwellPos.y))
        }
      }, 3000)
    }

    const handlePointerDown = (e: PointerEvent) => {
      // 排除宠物本体交互（摸头/双击）
      if ((e.target as HTMLElement | null)?.closest('[data-pet="roaming"]')) return
      if (Math.random() < 0.3) {
        registerZone(makeZone(e.clientX, e.clientY))
      }
    }

    const handleKeyDown = () => {
      if (Math.random() < 0.3) {
        const el = document.activeElement as HTMLElement | null
        const rect = el?.getBoundingClientRect()
        const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
        const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
        registerZone(makeZone(x, y))
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // ── 格内物理状态机（calendar-cell 互动，rAF 帧循环） ──
  // 贴边行走 / 重力下沉 / 吸附落定 / 偶尔跳跃；完成度决定风格（快=绕圈+跳跃+happy / 慢=贴底边+懒散）
  // 帧循环仅格内激活；离开格子/会话超时/组件卸载强制退出并恢复游走
  const exitCellPhysics = useCallback(() => {
    const ph = cellPhysicsRef.current
    if (!ph) return
    if (ph.rafId) cancelAnimationFrame(ph.rafId)
    cellPhysicsRef.current = null
    setPacingCellId(null)
    setClingEdge(null)
    // 记录刚互动过的格子：同格子不立即重启（须先离开格子在可再次互动）
    lastPacedCellRef.current = ph.zone.id
    usePetStore.getState().setAction('idle')
    // 游走 tick 保持心跳（格内期间跳过目标设置），下一 tick 自然恢复游走
  }, [])

  // 帧循环自引用：useCallback 内访问自身会触发 react-hooks/immutability（声明前访问），
  // 用 ref 持有最新 tick（与 scheduleWanderRef 同模式）
  const cellPhysicsTickRef = useRef<((now: number) => void) | null>(null)
  const cellPhysicsTick = useCallback((now: number) => {
    const ph = cellPhysicsRef.current
    if (!ph) return
    const { zone, style } = ph
    const r = zone.rect
    const completion = (zone.payload as CalendarCellPayload | undefined)?.completion ?? 0
    const marginY = Math.min(20, (r.bottom - r.top) * 0.15)

    // 会话超时强制退出（防卡死）
    if (now - ph.sessionStart > cellSessionDuration(completion)) {
      exitCellPhysics()
      return
    }

    switch (ph.state) {
      case 'enter': {
        // 从当前位置向格中心偏下移动（落地感）
        const target = { x: (r.left + r.right) / 2, y: r.top + (r.bottom - r.top) * 0.65 }
        ph.current = moveToward(ph.current, target, 80, 16)
        if (Math.hypot(target.x - ph.current.x, target.y - ph.current.y) < 2) {
          ph.state = 'cling'
          ph.clingUntil = now + randomRange(style.clingDuration[0], style.clingDuration[1])
        }
        break
      }
      case 'cling': {
        // 重力下沉贴底边（水平保持吸附点）
        ph.current = applyGravity(ph.current, r, marginY)
        if (now >= ph.clingUntil) {
          const store = usePetStore.getState()
          if (Math.random() < style.hopChance) {
            // 贴边跳跃（sin 抛物线，复用 jump 动画与影子）
            ph.state = 'hop'
            ph.hopStart = now
            ph.landY = ph.current.y
            store.setAction('jump')
          } else {
            // 走向下一个吸附点（沿边顺序绕圈，不回头）
            ph.state = 'walk'
            ph.target = nextClingPoint(ph.current, ph.edges, ph.visited)
            setClingEdge(ph.target.edge) // 贴壁旋转（左/右壁形象横过来）
            store.setAction('walk')
            store.setFacing(computeFacing(ph.current.x, ph.target.x))
          }
        }
        break
      }
      case 'walk': {
        const target = ph.target!
        ph.current = moveToward(ph.current, target, style.walkSpeed, 16)
        if (Math.hypot(target.x - ph.current.x, target.y - ph.current.y) < 4) {
          // 吸附落定：位置吸附到边线 + 短停留
          ph.current = { ...target }
          ph.state = 'cling'
          ph.clingUntil = now + randomRange(style.clingDuration[0], style.clingDuration[1])
        }
        break
      }
      case 'hop': {
        const t = (now - ph.hopStart) / 600
        if (t >= 1) {
          ph.current.y = ph.landY
          ph.state = 'cling'
          ph.clingUntil = now + randomRange(style.clingDuration[0], style.clingDuration[1])
          usePetStore.getState().setAction('pace')
        } else {
          ph.current.y = ph.landY + hopOffset(t)
        }
        break
      }
    }

    // 离开格子 → 退出格内互动恢复游走（实际离开，重置"刚互动过"标记）
    if (!isInsideRect(ph.current, r)) {
      lastPacedCellRef.current = null
      exitCellPhysics()
      return
    }

    const store = usePetStore.getState()
    store.setPosition(ph.current)
    ph.rafId = requestAnimationFrame((t) => cellPhysicsTickRef.current?.(t))
  }, [exitCellPhysics])

  // 保持 ref 与最新 tick 同步
  useEffect(() => {
    cellPhysicsTickRef.current = cellPhysicsTick
  })

  const startCellPhysics = useCallback((zone: Zone) => {
    if (cellPhysicsRef.current) return // 已在格内互动中（进入边沿防抖）
    const completion = (zone.payload as CalendarCellPayload | undefined)?.completion ?? 0
    const style = createCellStyle(completion)
    const edges = cellEdges(zone.rect, style.bottomOnly)
    const store = usePetStore.getState()

    cellPhysicsRef.current = {
      rafId: null,
      zone,
      style,
      state: 'enter',
      current: { ...store.position },
      target: null,
      landY: 0,
      edges,
      visited: new Set(),
      clingUntil: 0,
      hopStart: 0,
      sessionStart: performance.now(),
    }
    setPacingCellId(zone.id)
    setClingEdge('bottom')
    store.setAction('pace')
    store.setEmotion(style.emotion, cellSessionDuration(completion))
    cellPhysicsRef.current.rafId = requestAnimationFrame((t) => cellPhysicsTickRef.current?.(t))
  }, [])

  // ── 游走循环（使用 ref 打破递归 useCallback 的 ESLint 警告） ──
  const scheduleWanderRef = useRef<() => void>(() => {})

  // 游走节奏与渲染解耦：tick 回调经 store.getState() 读取实时状态（position/交互时间/休息态），
  // useCallback 依赖收敛为稳定引用（Zustand actions + useCallback([]) 函数）→ 渲染（refetch/情绪/hover）
  // 不再重建 scheduleWander、不清 timer 重排，tick 间隔保持纯 10-30s 随机（spec: Roam cadence survives re-render）
  const scheduleWander = useCallback(() => {
    if (wanderTimerRef.current) clearTimeout(wanderTimerRef.current)

    const interval = randomWanderInterval()
    wanderTimerRef.current = setTimeout(() => {
      // 每次循环取最新状态与 Zone 列表（移除后立即失效）
      const { position, lastInteractionTime, isResting } = usePetStore.getState()
      const activeZones = getZones().filter(z => z.type === 'user-interaction')
      const homeZone = getZones().find(z => z.type === 'pet-spot') ?? null
      const inHome = homeZone ? isInsideRect(position, homeZone.rect) : false
      const mode = determineMode({
        lastInteractionAt: lastInteractionTime,
        hasActiveZone: activeZones.length > 0,
        isNightTime: new Date().getHours() >= 23,
      })

      // 进窝边沿检测：仅当"上一 tick 不在窝内 && 当前在窝内 && 未休息"才进窝
      // 防止唤醒后 position 仍在窝内时下一 tick 立即再次进窝（须先离开窝区才可再进窝）
      // 注意：用本地 resting 同步进窝后的状态（getState 读到的 isResting 是进窝前一刻的值，
      // 若直接用于下方分支判断会走 wandering 分支覆盖进窝）
      let resting = isResting
      const wasInHome = wasInHomeRef.current
      wasInHomeRef.current = inHome
      if (inHome && !wasInHome && !resting) {
        startResting()
        resting = true
        // 进窝即睡：sleep 动作（SVG 层闭眼+蜷缩+Zzz）——不用 setEmotion（会重置 isResting）
        setAction('sleep')
      }

      // 格内互动进行中：tick 保持心跳但跳过游走目标设置（位置由 rAF 帧循环驱动）
      if (cellPhysicsRef.current) {
        scheduleWanderRef.current()
        return
      }

      // 格内互动：进入 calendar-cell Zone（未进窝/未休息/未在格内互动/非刚互动过的格子）→ 启动格内物理状态机
      // rAF 帧循环独立驱动格内移动（贴边/重力/吸附/跳跃）；会话超时/离开格子自动退出恢复游走
      const cellZone = getZones().find(
        (z) => z.type === 'calendar-cell' && isInsideRect(position, z.rect)
      )
      if (
        cellZone && !inHome && !resting && !cellPhysicsRef.current &&
        cellZone.id !== lastPacedCellRef.current
      ) {
        startCellPhysics(cellZone)
        scheduleWanderRef.current()
        return
      }
      if (!cellZone && cellPhysicsRef.current) {
        exitCellPhysics()
        lastPacedCellRef.current = null // 已离开格子，重置"刚互动过"标记
      }

      let target: ReturnType<typeof computeNextTarget>

      if (resting) {
        // 休息中：在窝内原地不动；在窝外（2 分钟 resting 途中）走向小窝
        target = inHome
          ? position
          : homeZone
            ? zoneCenter(homeZone)
            : computeNextTarget(position, configRef.current, 'resting')
      } else if (mode === 'resting') {
        // 无交互 2 分钟（在窝外）：走向小窝休息，无小窝时 fallback 既有 resting 目标
        // 走路中保持 walk（汇合处设置）；到达后 onAnimationComplete 因 isResting=true 回 sleep
        target = homeZone
          ? zoneCenter(homeZone)
          : computeNextTarget(position, configRef.current, 'resting')
        startResting()
      } else {
        if (resting) wakeUp()
        if (mode === 'attracted') {
          target = computeNextTarget(position, configRef.current, 'attracted', {
            activeZone: activeZones[0],
          })
        } else {
          target = computeNextTarget(position, configRef.current, 'wandering')
        }
      }

      const newFacing = computeFacing(position.x, target.x)
      setFacing(newFacing)
      // 移动中 = 走路动作（resting 原地不动或 mode==='idle' 时不设）
      if (target.x !== position.x || target.y !== position.y) setAction('walk')
      setPosition(target)

      scheduleWanderRef.current()
    }, interval)
  }, [startResting, wakeUp, setFacing, setPosition, setAction, startCellPhysics, exitCellPhysics])

  // 保持 ref 与最新 scheduleWander 同步
  useEffect(() => {
    scheduleWanderRef.current = scheduleWander
  })

  useEffect(() => {
    if (pet) scheduleWander()
    return () => {
      // 渲染重跑时只清游走 timer；往返 timer 由独立卸载 effect 清理（避免渲染重跑中断往返）
      if (wanderTimerRef.current) clearTimeout(wanderTimerRef.current)
    }
  }, [pet, scheduleWander])

  // 组件卸载时清理格内帧循环
  useEffect(() => {
    return () => exitCellPhysics()
  }, [exitCellPhysics])

  // ── 空闲小动作 ──
  useEffect(() => {
    const scheduleIdleVariant = () => {
      if (idleVariantTimerRef.current) clearTimeout(idleVariantTimerRef.current)
      idleVariantTimerRef.current = setTimeout(() => {
        const store = usePetStore.getState()
        if (store.emotionState === 'idle') {
          store.setEmotion('idle_variant', 2500)
        }
        scheduleIdleVariant()
      }, 15000 + Math.random() * 15000)
    }

    scheduleIdleVariant()
    return () => {
      if (idleVariantTimerRef.current) clearTimeout(idleVariantTimerRef.current)
    }
  }, [])

  // ── 无宠物自动弹出选择框 ──
  // isFetching 守卫：创建宠物成功后的 refetch 窗口期（isError 仍为旧值）不再重开 Dialog
  useEffect(() => {
    if (isError && !isLoading && !isFetching) {
      setSelectionOpen(true)
    }
  }, [isError, isLoading, isFetching, setSelectionOpen])

  // ── 交互处理 ──
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    wakeUp()
    setEmotion('happy', 3000)
    showBubble('好舒服~ ฅ^•ﻌ•^ฅ')
    clearParticleTrigger() // 清除旧触发
    // 使用 setTimeout 确保 clear 先生效，然后 trigger 新粒子
    setTimeout(() => {
      usePetStore.getState().triggerParticle('hearts')
    }, 0)
  }, [wakeUp, setEmotion, showBubble, clearParticleTrigger])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    wakeUp()
    setEmotion('excited', 4000)
    setAction('jump', 600) // 跳起 + 影子缩小变淡
    showBubble('一起玩！🎾')
  }, [wakeUp, setEmotion, setAction, showBubble])

  /** 回窝睡觉：立即回到小窝（蜷缩 + Zzz）；格内互动中先退出 */
  const handleReturnHome = useCallback(() => {
    const homeZone = getZones().find((z) => z.type === 'pet-spot')
    if (!homeZone) {
      showBubble('还没有小窝…')
      return
    }
    if (cellPhysicsRef.current) exitCellPhysics()
    const center = zoneCenter(homeZone)
    const store = usePetStore.getState()
    store.setPosition(center)
    store.setFacing('right')
    store.startResting()
    store.setAction('sleep')
    showBubble('晚安~ 😴')
  }, [exitCellPhysics, showBubble])

  const handleMouseEnter = useCallback(() => {
    // 清除旧的 hover 计时器
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setHovered(false), 3000)
  }, [])

  // ── 移动时长 ──
  // 往返中（格内互动）用快速动画匹配 1.5-4.5s 往返节奏；休息时慢速
  // useMemo 固定同一状态区间内的时长：渲染（position 变化/refetch）不再重随机导致动画时长抖动
  const moveDuration = useMemo(() => {
    if (isResting) return randomMoveDuration(0.5)
    // 格内：rAF 帧循环驱动位置，motion 用 ~0.08s 短缓动即时跟随（长缓动会吞掉 rAF 步进）
    if (pacingCellId) return 80
    return randomMoveDuration(1)
  }, [isResting, pacingCellId])

  return (
    <>
      <PetSelection />

      {pet && (
        <>
          {/* 粒子爆发 — 由事件总线或手动交互触发 */}
          <AnimatePresence>
            {particleTrigger && (
              <ParticleBurst
                key={particleTrigger.timestamp}
                origin={{ x: position.x, y: position.y }}
                type={particleTrigger.type}
                count={8}
                onDone={() => clearParticleTrigger()}
              />
            )}
          </AnimatePresence>

          {/* 浮动数值反馈 — 互动/购买结果（喂食/玩耍/购买成功） */}
          <AnimatePresence>
            {feedbackTrigger && (
              <FloatingText
                key={feedbackTrigger.timestamp}
                origin={{ x: position.x, y: position.y - 50 }}
                items={feedbackTrigger.items}
                onDone={() => clearFeedback()}
              />
            )}
          </AnimatePresence>

          {/* 互动菜单（hover 浮窗按钮打开） */}
          <PetMenu open={menuOpen} onOpenChange={setMenuOpen} />

          {/* 宠物本体 */}
          <motion.div
            data-pet="roaming"
            animate={{ x: position.x, y: position.y }}
            transition={{ duration: moveDuration / 1000, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              // 格内互动中：action 由 rAF 状态机驱动（pace/walk/jump），不被动画完成重置
              if (cellPhysicsRef.current) return
              // 移动结束：休息中回 sleep，否则回 idle（getState 读取避免旧闭包）
              const s = usePetStore.getState()
              s.setAction(s.isResting ? 'sleep' : 'idle')
            }}
            className="fixed z-40 select-none"
            style={{ pointerEvents: 'none' }}
            initial={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }}
          >
            <div
              className="relative"
              style={{ pointerEvents: 'auto' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* 气泡 — 在翻转容器外，文字任何朝向保持正读 */}
              <PetBubble />

              {/* 宠物精灵 — 翻转仅作用于身体（scaleX 在此层，不波及气泡/hover 浮窗文字）
                  贴壁旋转：格内贴左/右壁时形象横过来（rotate ±90°） */}
              <div style={{
                transform:
                  (facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)') +
                  (clingEdge === 'left' ? ' rotate(90deg)' : clingEdge === 'right' ? ' rotate(-90deg)' : ''),
              }}>
                <div
                  onClick={handleClick}
                  onDoubleClick={handleDoubleClick}
                  className="cursor-pointer"
                  title="点击摸头 | 双击玩耍"
                >
                  <PetAvatar size={90} />
                </div>
              </div>

              {/* Hover 状态浮窗 */}
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-surface/95 backdrop-blur rounded-xl shadow-lg border border-border-subtle p-2 min-w-[120px]"
                    style={{ pointerEvents: 'none' }}
                  >
                    <PetStatus pet={pet} isLoading={false} />
                    <div className="mt-2 flex gap-1.5" style={{ pointerEvents: 'auto' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(true)
                        }}
                        className="flex-1 rounded-lg bg-accent text-accent-fg text-xs py-1.5 hover:bg-accent-hover transition-colors"
                      >
                        🎾 互动
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReturnHome()
                        }}
                        className="flex-1 rounded-lg border border-border-subtle text-xs py-1.5 hover:bg-hover transition-colors"
                      >
                        😴 回窝
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </>
  )
}

