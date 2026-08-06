import { OrangeCat } from '../assets/svg/OrangeCat'
import { ShibaInu } from '../assets/svg/ShibaInu'
import type { EmotionState, PetAction } from '../store/petStore'

interface SvgAvatarProps {
  species: 'ORANGE_CAT' | 'SHIBA_INU'
  emotion: EmotionState
  action?: PetAction
  size?: number
  className?: string
}

/**
 * SVG 插画渲染组件。
 * 根据 species + emotion + action 选择对应的 SVG 插画
 * （emotion 管表情参数，action 管 CSS 动画层，正交）。
 */
export function SvgAvatar({ species, emotion, action = 'idle', size = 100, className }: SvgAvatarProps) {
  const Component = species === 'SHIBA_INU' ? ShibaInu : OrangeCat

  return (
    <Component emotion={emotion} action={action} size={size} className={className} />
  )
}
