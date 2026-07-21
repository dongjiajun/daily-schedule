import { useSettingsStore } from '@/core/store/settingsStore'
import { FireworkEffect } from './FireworkEffect'
import { SnowfallEffect } from './SnowfallEffect'
import { PetalFallEffect } from './PetalFallEffect'
import { LanternFallEffect } from './LanternFallEffect'

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

  const effectType = getEffectType(activeHolidayId)

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
      {/* heart / leaf effects are handled by CSS gradient overlay in themes */}
    </div>
  )
}

/**
 * 从 THEME_MAP 中读取当前节日的 effectType。
 * 简化版：直接映射已知节日 id → effectType。
 * 完整版应由 holidayEngine.getActiveTheme() 提供 theme.effectType。
 */
function getEffectType(holidayId: string): string {
  const effectMap: Record<string, string> = {
    'spring-festival': 'firework',
    'new-year': 'firework',
    'new-years-eve': 'firework',
    'christmas': 'snow',
    'christmas-eve': 'snow',
    'sakura': 'petal',
    'easter': 'petal',
    'halloween': 'lantern',
    'mid-autumn': 'lantern',
    'lantern-festival': 'lantern',
    'diwali': 'lantern',
  }
  return effectMap[holidayId] ?? 'none'
}
