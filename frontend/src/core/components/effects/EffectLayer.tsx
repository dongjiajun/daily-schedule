import { useSettingsStore } from '@/core/store/settingsStore'
import { getThemeForHoliday } from '@daily-schedule/shared/holiday'
import { FireworkEffect } from './FireworkEffect'
import { SnowfallEffect } from './SnowfallEffect'
import { PetalFallEffect } from './PetalFallEffect'
import { LanternFallEffect } from './LanternFallEffect'
import { LeafFallEffect } from './LeafFallEffect'
import { HeartFallEffect } from './HeartFallEffect'

/**
 * 特效渲染容器 — 根据当前节日和用户设置激活对应视觉效果。
 * pointer-events: none，不阻挡用户交互。
 * 自动检测移动端和 prefers-reduced-motion。
 */
export function EffectLayer() {
  const effectIntensity = useSettingsStore((s) => s.effectIntensity)
  const activeHolidayId = useSettingsStore((s) => s.activeHolidayId)

  // 用户关闭特效
  if (effectIntensity === 'off') return null

  // 系统减动画偏好
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  // 移动端自动降级
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const intensity = isMobile ? 'low' : effectIntensity

  // 无活跃节日
  if (!activeHolidayId) return null

  // 特效类型统一由共享包 THEME_MAP 解析（唯一真相源，无本地映射副本）
  const effectType = getThemeForHoliday(activeHolidayId).effectType

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 1, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {effectType === 'firework' && <FireworkEffect intensity={intensity} />}
      {effectType === 'snow' && <SnowfallEffect intensity={intensity} />}
      {effectType === 'petal' && <PetalFallEffect intensity={intensity} />}
      {effectType === 'lantern' && <LanternFallEffect intensity={intensity} />}
      {effectType === 'leaf' && <LeafFallEffect intensity={intensity} />}
      {effectType === 'heart' && <HeartFallEffect intensity={intensity} />}
    </div>
  )
}
