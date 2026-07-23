import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { SvgAvatar } from './SvgAvatar'

/**
 * 侧边栏迷你宠物 — 常驻在 Sidebar 底部。
 * 40-50px 精灵 + 心情/饱食度迷你指示点。
 * 点击跳转到 /pet 完整页面。
 */
export function SidebarPet({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { data: pet, isLoading } = useMyPet()
  const emotionState = usePetStore((s) => s.emotionState)
  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)

  const handleClick = () => {
    if (pet) {
      navigate('/pet')
      onNavigate?.()
    } else {
      setSelectionOpen(true)
    }
  }

  // 心情/饱食度颜色（主题化，但保底硬编码）
  const moodColor = pet ? (pet.mood! >= 60 ? 'var(--color-accent, #22c55e)' : pet.mood! >= 30 ? '#eab308' : '#ef4444') : '#9ca3af'
  const hungerColor = pet ? (pet.hunger! >= 60 ? 'var(--color-accent, #22c55e)' : pet.hunger! >= 30 ? '#eab308' : '#ef4444') : '#9ca3af'

  return (
    <div className="px-4 py-3 border-t border-border-subtle">
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
