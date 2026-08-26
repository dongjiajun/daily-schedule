import { Input, Text, View } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { SPECIES_META, type PetSpecies } from '../../lib/pet'

/**
 * 无宠物创建表单（整页引导态）。
 *
 * 物种二选一 chips（ORANGE_CAT/SHIBA_INU）+ 命名 Input（必填 maxLength 30，
 * 前端校验兜底，服务端 OpenAPI 契约同约束）+ 提交按钮。提交中 `busy` 置忙
 * 防重复创建（后端 409 已有宠物为兜底）。空名/超长提示用 Taro.showToast
 * （原生 API——NutUI Toast 的 css 含 var() 嵌套 calc，微信 wxss 不支持）。
 */

interface PetCreateFormProps {
  busy: boolean
  onSubmit: (input: { species: PetSpecies; name: string }) => Promise<void>
}

const SPECIES_OPTIONS: readonly PetSpecies[] = ['ORANGE_CAT', 'SHIBA_INU']
const NAME_MAX_LENGTH = 30

export default function PetCreateForm({ busy, onSubmit }: PetCreateFormProps) {
  const [species, setSpecies] = useState<PetSpecies>('ORANGE_CAT')
  const [name, setName] = useState('')

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (trimmed === '') {
      Taro.showToast({ title: '名称不能为空', icon: 'none' })
      return
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      Taro.showToast({ title: `名称最长 ${NAME_MAX_LENGTH} 字`, icon: 'none' })
      return
    }
    await onSubmit({ species, name: trimmed })
  }

  return (
    <View className='mp-pet-create'>
      <Text className='mp-pet-create-title'>还没有宠物伙伴</Text>
      <Text className='mp-pet-create-desc'>创建一只宠物，陪它喂食、玩耍、一起游走～</Text>

      <View className='mp-pet-create-field'>
        <Text className='mp-pet-create-label'>选择物种</Text>
        <View className='mp-pet-create-chips'>
          {SPECIES_OPTIONS.map(s => {
            const meta = SPECIES_META[s]
            const selected = s === species
            return (
              <View
                key={s}
                className={`mp-pet-create-chip${selected ? ' mp-pet-create-chip--active' : ''}`}
                style={{ borderColor: selected ? meta.color : undefined }}
                onClick={() => setSpecies(s)}
              >
                <Text>{meta.emoji}</Text>
                <Text>{meta.label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      <View className='mp-pet-create-field'>
        <Text className='mp-pet-create-label'>给宠物起名</Text>
        <Input
          className='mp-pet-create-input'
          value={name}
          placeholder='宠物姓名（必填）'
          maxlength={NAME_MAX_LENGTH}
          onInput={e => setName(e.detail.value)}
        />
      </View>

      <View
        className={`mp-pet-create-btn${busy ? ' mp-pet-create-btn--busy' : ''}`}
        onClick={busy ? undefined : handleSubmit}
      >
        <Text>{busy ? '创建中…' : '创建宠物'}</Text>
      </View>
    </View>
  )
}
