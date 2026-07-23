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
} from '@daily-schedule/shared/pet'
import type { RoamingConfig, AvoidZone } from '@daily-schedule/shared/pet'

/**
 * 游走宠物 — 替代 PetPanel 的 v2 角色式宠物。
 * - 以独立精灵在页面自由漫步
 * - pointer-events: none 穿透
 * - 点击摸头 / 双击玩耍
 * - Hover 显示迷你状态浮窗
 */
export function RoamingPet() {
  const { data: pet, isLoading, isError } = useMyPet()
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
    const observer = new MutationObserver(updateAvoidZones)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [updateAvoidZones])

  // ── 游走循环（使用 ref 打破递归 useCallback 的 ESLint 警告） ──
  const scheduleWanderRef = useRef<() => void>(() => {})

  const scheduleWander = useCallback(() => {
    if (wanderTimerRef.current) clearTimeout(wanderTimerRef.current)

    const interval = randomWanderInterval()
    wanderTimerRef.current = setTimeout(() => {
      const mode = determineMode({
        lastInteractionAt: lastInteractionTime,
        hasActiveInterestPoint: false,
        isNightTime: new Date().getHours() >= 23,
      })

      let target: ReturnType<typeof computeNextTarget>

      if (mode === 'resting') {
        target = computeNextTarget(position, configRef.current, 'resting')
        startResting()
      } else {
        if (isResting) wakeUp()
        target = computeNextTarget(position, configRef.current, 'wandering')
      }

      const newFacing = computeFacing(position.x, target.x)
      setFacing(newFacing)
      setPosition(target)

      scheduleWanderRef.current()
    }, interval)
  }, [position, lastInteractionTime, isResting, setFacing, setPosition, startResting, wakeUp])

  // 保持 ref 与最新 scheduleWander 同步
  useEffect(() => {
    scheduleWanderRef.current = scheduleWander
  })

  useEffect(() => {
    if (pet) scheduleWander()
    return () => {
      if (wanderTimerRef.current) clearTimeout(wanderTimerRef.current)
    }
  }, [pet, scheduleWander])

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
  useEffect(() => {
    if (isError && !isLoading) {
      setSelectionOpen(true)
    }
  }, [isError, isLoading, setSelectionOpen])

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
  const moveDuration = randomMoveDuration(
    isResting ? 0.5 : 1
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
            style={{
              pointerEvents: 'none',
              scaleX: facing === 'left' ? -1 : 1,
            }}
            initial={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }}
          >
            <div
              className="relative"
              style={{ pointerEvents: 'auto' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* 气泡 */}
              <PetBubble />

              {/* 宠物精灵 */}
              <div
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                className="cursor-pointer"
                title="点击摸头 | 双击玩耍"
              >
                <PetAvatar size={90} />
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

