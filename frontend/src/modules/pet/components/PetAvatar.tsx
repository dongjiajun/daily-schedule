import { usePetStore } from '../store/petStore'

interface PetAvatarProps {
  size?: number
}

/**
 * 宠物形象组件。
 *
 * M1.2 暂无 .riv 动画文件，当前使用 emoji 占位。
 * 待设计师提供动画文件后移入 useRive 调用即可启用 Rive 动画。
 */
export function PetAvatar({ size = 100 }: PetAvatarProps) {
  const animationState = usePetStore((s) => s.animationState)

  const emoji = animationState === 'happy' ? '😸'
    : animationState === 'sad' ? '😿'
    : animationState === 'hungry' ? '😾'
    : '🐱'

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      aria-label={`宠物状态: ${animationState}`}
    >
      {emoji}
    </div>
  )
}
