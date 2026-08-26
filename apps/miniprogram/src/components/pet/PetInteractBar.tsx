import { Text, View } from '@tarojs/components'

/**
 * 互动按钮条（喂食/玩耍）。
 *
 * 按钮为自绘 View（不含 NutUI Button——其 css 含 CSS 变量嵌套 calc，微信 wxss
 * 不支持 var()，见 component-catalog 坑位备忘）。`busy` = 互动请求进行中，
 * 两钮一并置忙，防连点重复喂食（spec：互动中防重复提交）。
 */

interface PetInteractBarProps {
  /** 互动请求进行中（按钮置忙） */
  busy: boolean
  onFeed: () => void
  onPlay: () => void
}

export default function PetInteractBar({ busy, onFeed, onPlay }: PetInteractBarProps) {
  return (
    <View className='mp-pet-interact-bar'>
      <View
        className={`mp-pet-interact-btn${busy ? ' mp-pet-interact-btn--busy' : ''}`}
        onClick={busy ? undefined : onFeed}
      >
        <Text>🍖 喂食</Text>
      </View>
      <View
        className={`mp-pet-interact-btn mp-pet-interact-btn--play${busy ? ' mp-pet-interact-btn--busy' : ''}`}
        onClick={busy ? undefined : onPlay}
      >
        <Text>🪀 玩耍</Text>
      </View>
    </View>
  )
}
