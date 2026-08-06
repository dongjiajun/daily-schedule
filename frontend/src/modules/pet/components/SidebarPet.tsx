import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { registerZone, updateZoneRect } from '../lib/zoneRegistry'
import { statusColor } from '../lib/statusColor'
import type { Zone } from '@daily-schedule/shared/pet'
import { SvgAvatar } from './SvgAvatar'

/** 宠物小窝 Zone id（RoamingPet 进窝检测据此识别） */
export const PET_HOME_ZONE_ID = 'pet-home-spot'

/**
 * 侧边栏迷你宠物 — 常驻在 Sidebar 底部。
 * 40-50px 精灵 + 心情/饱食度迷你指示点。
 * 点击跳转到 /pet 完整页面。
 * 该区域注册为 `pet-spot` Zone（宠物小窝）——游走宠物进入即自动进窝休息。
 */
export function SidebarPet({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { data: pet, isLoading } = useMyPet()
  const emotionState = usePetStore((s) => s.emotionState)
  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)
  const homeRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    if (pet) {
      navigate('/pet')
      onNavigate?.()
    } else {
      setSelectionOpen(true)
    }
  }

  // 心情/饱食度颜色（共享三段色函数）
  const moodColor = pet ? statusColor(pet.mood!) : '#9ca3af'
  const hungerColor = pet ? statusColor(pet.hunger!) : '#9ca3af'

  // ── 注册宠物小窝 Zone（pet-spot）──
  // 组件生命周期 = Zone 生命周期：挂载注册、卸载注销；scroll/resize 事件驱动 rect 更新
  useEffect(() => {
    const el = homeRef.current
    if (!pet || !el) return

    const readRect = (): Zone['rect'] => {
      const r = el.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    }

    const unregister = registerZone({
      id: PET_HOME_ZONE_ID,
      type: 'pet-spot',
      rect: readRect(),
      weight: 1,
    })

    const refresh = () => updateZoneRect(PET_HOME_ZONE_ID, readRect())
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
      unregister()
    }
  }, [pet])

  return (
    <div ref={homeRef} className="px-4 py-3 border-t border-border-subtle">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors group"
      >
        {/* 迷你精灵 */}
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {isLoading ? (
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
          ) : pet ? (
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <SvgAvatar
                species={pet.species as 'ORANGE_CAT' | 'SHIBA_INU'}
                emotion={emotionState}
                size={40}
              />
            </motion.div>
          ) : (
            <span className="text-xl opacity-50">🐾</span>
          )}
        </div>

        {/* 状态摘要 */}
        <div className="flex-1 min-w-0">
          {pet ? (
            <>
              <div className="text-[13px] font-medium text-foreground truncate">
                {pet.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {/* 心情指示点 */}
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: moodColor }}
                    title={`心情: ${pet.mood}`}
                  />
                </span>
                {/* 饱食度指示点 */}
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: hungerColor }}
                    title={`饱食度: ${pet.hunger}`}
                  />
                </span>
                <span className="text-[11px] text-foreground-muted">
                  Lv.{pet.level}
                </span>
              </div>
            </>
          ) : (
            <span className="text-[13px] text-foreground-muted group-hover:text-accent transition-colors">
              领养一只伙伴
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
