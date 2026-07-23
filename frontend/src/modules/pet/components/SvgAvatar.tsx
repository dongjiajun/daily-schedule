import { OrangeCat } from '../assets/svg/OrangeCat'
import { ShibaInu } from '../assets/svg/ShibaInu'
import type { EmotionState } from '../store/petStore'

interface SvgAvatarProps {
  species: 'ORANGE_CAT' | 'SHIBA_INU'
  emotion: EmotionState
  size?: number
  className?: string
}

/**
 * SVG 插画渲染组件。
 * 根据 species + emotion 选择对应的 SVG 插画。
 */
export function SvgAvatar({ species, emotion, size = 100, className }: SvgAvatarProps) {
  const Component = species === 'SHIBA_INU' ? ShibaInu : OrangeCat

  return (
    <Component emotion={emotion} size={size} className={className} />
  )
}
