import { Text, View } from '@tarojs/components'
import { SPECIES_META, type PetSpecies } from '../../lib/pet'

/**
 * 宠物形象（游走视图：绝对定位由页面传入 x/y，px）。
 *
 * 表现层为 emoji + 颜色圈底（微信 image 不支持 svg，Web 端 SvgAvatar 不可复用；
 * emoji 零资源零引入，见 design Decision 3）。互动成功时页面切 `bouncing`
 * 触发 CSS 弹跳动画（--bounce class），动画结束后页面复位。
 * 语言气泡/浮动数值反馈由页面的反馈层渲染，不在本组件内。
 */

interface PetAvatarProps {
  species: PetSpecies
  x: number
  y: number
  /** 互动成功反馈动画开关（true = 播放弹跳一次） */
  bouncing?: boolean
  size?: number
}

export default function PetAvatar({ species, x, y, bouncing = false, size = 56 }: PetAvatarProps) {
  const meta = SPECIES_META[species]
  return (
    <View
      className={`mp-pet-avatar${bouncing ? ' mp-pet-avatar--bounce' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: meta.color,
      }}
    >
      <Text className='mp-pet-avatar-emoji'>{meta.emoji}</Text>
    </View>
  )
}
