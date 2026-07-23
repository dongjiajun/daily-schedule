import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { SvgAvatar } from './SvgAvatar'
// import { useLottie } from '../hooks/useLottie' // Lottie 引擎后续集成

interface PetAvatarProps {
  size?: number
}

/**
 * 宠物形象组件。
 *
 * 渲染引擎优先级:
 * 1. Lottie 动画 (计划中, useLottie hook)
 * 2. SVG 插画 (当前使用, SvgAvatar)
 *
 * 通过 species + emotionState 自动选择对应的视觉资源。
 */
export function PetAvatar({ size = 100 }: PetAvatarProps) {
  const { data: pet } = useMyPet()
  const emotionState = usePetStore((s) => s.emotionState)

  const species = (pet?.species as 'ORANGE_CAT' | 'SHIBA_INU') ?? 'ORANGE_CAT'

  return (
    <div
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      aria-label={`宠物状态: ${emotionState}`}
    >
      <SvgAvatar
        species={species}
        emotion={emotionState}
        size={size}
      />
    </div>
  )
}
