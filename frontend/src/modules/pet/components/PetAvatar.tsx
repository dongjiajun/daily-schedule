import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { SvgAvatar } from './SvgAvatar'

interface PetAvatarProps {
  size?: number
}

const SHADOW_CSS = `
  .pet-shadow { width: 60%; height: 8px; margin: 2px auto 0; border-radius: 9999px;
    background: radial-gradient(ellipse, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 55%, transparent 75%);
    transition: transform 0.25s ease, opacity 0.25s ease; }
  [data-shadow-action="jump"] + .pet-shadow-wrap .pet-shadow,
  [data-shadow-action="jump"] .pet-shadow { transform: scale(0.7); opacity: 0.5; }
`

/**
 * 宠物形象组件。
 *
 * 渲染引擎: SVG 插画（SvgAvatar）— emotionState 管表情、action 管 CSS 动画层。
 * 身体下方叠加地面阴影椭圆（jump 时缩小变淡模拟离地）。
 */
export function PetAvatar({ size = 100 }: PetAvatarProps) {
  const { data: pet } = useMyPet()
  const emotionState = usePetStore((s) => s.emotionState)
  const action = usePetStore((s) => s.action)

  const species = (pet?.species as 'ORANGE_CAT' | 'SHIBA_INU') ?? 'ORANGE_CAT'

  return (
    <div
      style={{ width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      aria-label={`宠物状态: ${emotionState}`}
    >
      <style>{SHADOW_CSS}</style>
      <div data-shadow-action={action}>
        <SvgAvatar
          species={species}
          emotion={emotionState}
          action={action}
          size={size}
        />
      </div>
      <div className="pet-shadow-wrap" style={{ width: size }}>
        <div className="pet-shadow" />
      </div>
    </div>
  )
}
