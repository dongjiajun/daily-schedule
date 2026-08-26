import { Text, View } from '@tarojs/components'
import {
  hungerLabel, moodLabel, SPECIES_META, statusColor, statusPercent, type PetProfile,
} from '../../lib/pet'

/**
 * 宠物状态面板（页面底部卡片）。
 *
 * 展示等级徽章 + 心情条/饥饿条（三段色：≥60 绿 / 30-59 黄 / <30 红，对齐 Web 端
 * statusColor）+ 中文标签 + 经验数值 + 金币。互动后的数值变化浮动提示由页面
 * 反馈层渲染，本组件为纯展示（值来自已同步服务端确认响应的 PetProfile）。
 */

interface PetStatusProps {
  pet: PetProfile
}

export default function PetStatus({ pet }: PetStatusProps) {
  const meta = SPECIES_META[pet.species]
  return (
    <View className='mp-pet-status'>
      <View className='mp-pet-status-head'>
        <Text className='mp-pet-status-name'>{pet.name}</Text>
        <Text className='mp-pet-status-species'>{meta.label}</Text>
        <Text className='mp-pet-status-level'>Lv.{pet.level}</Text>
      </View>

      <View className='mp-pet-status-row'>
        <Text className='mp-pet-status-icon'>心情</Text>
        <View className='mp-pet-status-bar'>
          <View
            className='mp-pet-status-fill'
            style={{
              width: `${statusPercent(pet.mood)}%`,
              backgroundColor: statusColor(pet.mood),
            }}
          />
        </View>
        <Text className='mp-pet-status-value'>{pet.mood} {moodLabel(pet.mood)}</Text>
      </View>

      <View className='mp-pet-status-row'>
        <Text className='mp-pet-status-icon'>饥饿</Text>
        <View className='mp-pet-status-bar'>
          <View
            className='mp-pet-status-fill'
            style={{
              width: `${statusPercent(pet.hunger)}%`,
              backgroundColor: statusColor(pet.hunger),
            }}
          />
        </View>
        <Text className='mp-pet-status-value'>{pet.hunger} {hungerLabel(pet.hunger)}</Text>
      </View>

      <View className='mp-pet-status-meta'>
        <Text className='mp-pet-status-meta-item'>⭐ 经验 {pet.experience}</Text>
        <Text className='mp-pet-status-meta-item'>🪙 {pet.coins}</Text>
      </View>
    </View>
  )
}
