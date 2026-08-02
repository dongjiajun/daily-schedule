import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { PetAvatar } from './PetAvatar'
import { PetBubble } from './PetBubble'
import { PetStatus } from './PetStatus'
import { PetSelection } from './PetSelection'
import { ParticleBurst } from './ParticleBurst'
import {
  determineMode,
  computeNextTarget,
  computeFacing,
  randomWanderInterval,
  randomMoveDuration,
  createDefaultConfig,
  isInsideRect,
  zoneCenter,
} from '@daily-schedule/shared/pet'
import type { RoamingConfig, AvoidZone, Zone, CalendarCellPayload } from '@daily-schedule/shared/pet'
import { registerZone, getZones } from '../lib/zoneRegistry'

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
  const lastInteractionTime = usePetStore((s) => s.lastInteractionTime)
  const setEmotion = usePetStore((s) => s.setEmotion)
  const showBubble = usePetStore((s) => s.showBubble)

  const [hovered, setHovered] = useState(false)

  const particleTrigger = usePetStore((s) => s.particleTrigger)
  const clearParticleTrigger = usePetStore((s) => s.clearParticleTrigger)

  const configRef = useRef<RoamingConfig>(createDefaultConfig(window.innerWidth, window.innerHeight))
  const wanderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleVariantTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 进窝边沿守卫：记录上一 tick 是否在小窝内，仅"进入边沿"才触发进窝休息
  const wasInHomeRef = useRef(false)

  // ── 格内往返（calendar-cell 互动） ──
  const pacingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pacingZoneRef = useRef<Zone | null>(null)
  const pacingDirRef = useRef<1 | -1>(1)
  const pacingActiveRef = useRef(false)
  /** 最近一次自动停止往返的格子（同格子不重复往返，须先离开才可再次往返） */
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
      decayTime: 15_000,
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

  // ── 格内往返（calendar-cell 互动） ──
  // 宠物进入日期格子后格内左右交替走动；完成度决定速度/情绪（≥50% 快+happy / <50% 慢+懒散）
  // 往返自驱动（timer 自己 setPosition）→ 用"进入边沿"启动 + 有限次数后自动停止恢复游走
  const startPacing = useCallback((zone: Zone) => {
    if (pacingActiveRef.current) return // 已在往返中（进入边沿防抖）
    if (pacingTimerRef.current) clearTimeout(pacingTimerRef.current)
    pacingZoneRef.current = zone
    pacingDirRef.current = 1
    pacingActiveRef.current = true
    setPacingCellId(zone.id)

    const completion = (zone.payload as CalendarCellPayload | undefined)?.completion ?? 0
    const fast = completion >= 50
    const interval = fast ? 1500 + Math.random() * 1000 : 3000 + Math.random() * 1500
    const maxPaces = fast ? 8 : 5 // 快节奏多走几趟

    let paces = 0
    const pace = () => {
      const z = pacingZoneRef.current
      if (!z) {
        pacingActiveRef.current = false
        return
      }
      paces++
      if (paces > maxPaces) {
        // 往返结束 → 恢复游走；记录本格子防立即重启（须先离开格子才可再次往返）
        pacingActiveRef.current = false
        pacingZoneRef.current = null
        pacingTimerRef.current = null
        lastPacedCellRef.current = z.id
        setPacingCellId(null)
        return
      }
      const r = z.rect
      const margin = Math.min(20, (r.right - r.left) * 0.15)
      const targetX = pacingDirRef.current === 1 ? r.right - margin : r.left + margin
      const targetY = r.top + (r.bottom - r.top) / 2
      pacingDirRef.current = (pacingDirRef.current * -1) as 1 | -1

      const store = usePetStore.getState()
      store.setFacing(computeFacing(store.position.x, targetX))
      store.setPosition({ x: targetX, y: targetY })
      store.setEmotion(fast ? 'happy' : 'idle_variant', interval + 500)

      pacingTimerRef.current = setTimeout(pace, interval)
    }
    pacingTimerRef.current = setTimeout(pace, interval)
  }, [])

  const stopPacing = useCallback(() => {
    if (pacingTimerRef.current) clearTimeout(pacingTimerRef.current)
    pacingTimerRef.current = null
    pacingZoneRef.current = null
    pacingActiveRef.current = false
    setPacingCellId(null)
  }, [])

  // ── 游走循环（使用 ref 打破递归 useCallback 的 ESLint 警告） ──
  const scheduleWanderRef = useRef<() => void>(() => {})

  const scheduleWander = useCallback(() => {
    if (wanderTimerRef.current) clearTimeout(wanderTimerRef.current)

    const interval = randomWanderInterval()
    wanderTimerRef.current = setTimeout(() => {
      // 每次循环取最新 Zone 列表（移除后立即失效）
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
      // 注意：用本地 resting 同步进窝后的状态（闭包 isResting 是排 timer 时的旧值，
      // 若直接用于下方分支判断会走 wandering 分支覆盖进窝）
      let resting = isResting
      const wasInHome = wasInHomeRef.current
      wasInHomeRef.current = inHome
      if (inHome && !wasInHome && !resting) {
        startResting()
        resting = true
      }

      // 格内互动：进入 calendar-cell Zone（未进窝/未休息/未往返/非刚往返过的格子）→ 启动往返，跳过游走目标设置
      // 往返 timer 独立驱动格子内移动（有限次数后自动停止，同格子须先离开才可再次往返）
      const cellZone = getZones().find(
        (z) => z.type === 'calendar-cell' && isInsideRect(position, z.rect)
      )
      if (
        cellZone && !inHome && !resting && !pacingActiveRef.current &&
        cellZone.id !== lastPacedCellRef.current
      ) {
        startPacing(cellZone)
        scheduleWanderRef.current()
        return
      }
      if (!cellZone) {
        stopPacing()
        lastPacedCellRef.current = null // 已离开格子，重置"刚往返过"标记
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
      setPosition(target)

      scheduleWanderRef.current()
    }, interval)
  }, [position, lastInteractionTime, isResting, setFacing, setPosition, startResting, wakeUp, startPacing, stopPacing])

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

  // 组件卸载时清理往返 timer
  useEffect(() => {
    return () => stopPacing()
  }, [stopPacing])

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
    showBubble('一起玩！🎾')
  }, [wakeUp, setEmotion, showBubble])

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
  const moveDuration = randomMoveDuration(
    isResting ? 0.5 : pacingCellId ? 0.3 : 1
  )

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

          {/* 宠物本体 */}
          <motion.div
            data-pet="roaming"
            animate={{ x: position.x, y: position.y }}
            transition={{ duration: moveDuration / 1000, ease: 'easeInOut' }}
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

              {/* 宠物精灵 — 翻转仅作用于身体（scaleX 在此层，不波及气泡/hover 浮窗文字） */}
              <div style={{ transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}>
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

