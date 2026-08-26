import { beforeEach, describe, expect, it, vi } from 'vitest'

// pet.ts 依赖的请求层整体 mock（单测只验证数据层自身的解析/错误语义/请求参数）
vi.mock('../lib/api', () => ({
  apiRequest: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}))

import { apiRequest, UnauthorizedError } from '../lib/api'
import {
  createPet, fetchMyPet, hungerLabel, interactWithPet, moodLabel,
  parsePetProfile, statusColor, statusPercent,
} from '../lib/pet'

const apiRequestMock = vi.mocked(apiRequest)

const VALID_PET = {
  id: 1,
  species: 'ORANGE_CAT',
  name: '毛毛',
  experience: 120,
  level: 2,
  mood: 62,
  hunger: 45,
  coins: 300,
  currentAccessory: 5,
  lastInteractedAt: '2026-08-22T09:00:00',
  createdAt: '2026-08-01T09:00:00',
}

describe('parsePetProfile', () => {
  it('完整字段 → 规范化 PetProfile', () => {
    expect(parsePetProfile(VALID_PET)).toEqual({
      id: 1,
      species: 'ORANGE_CAT',
      name: '毛毛',
      experience: 120,
      level: 2,
      mood: 62,
      hunger: 45,
      coins: 300,
      currentAccessory: 5,
      lastInteractedAt: '2026-08-22T09:00:00',
      createdAt: '2026-08-01T09:00:00',
    })
  })

  it('可选字段缺失 → 归一（undefined）', () => {
    const pet = parsePetProfile({
      id: 1, species: 'SHIBA_INU', name: '豆豆',
      experience: 0, level: 1, mood: 50, hunger: 50, coins: 0,
    })
    expect(pet.currentAccessory).toBeUndefined()
    expect(pet.lastInteractedAt).toBeUndefined()
    expect(pet.createdAt).toBeUndefined()
  })

  it('缺 name（空串）→ 抛「宠物数据格式异常」', () => {
    expect(() => parsePetProfile({ ...VALID_PET, name: '' })).toThrow('宠物数据格式异常')
  })

  it('species 非枚举 → 抛异常', () => {
    expect(() => parsePetProfile({ ...VALID_PET, species: 'DRAGON' })).toThrow('宠物数据格式异常')
  })

  it('mood 非 number → 抛异常', () => {
    expect(() => parsePetProfile({ ...VALID_PET, mood: 'high' })).toThrow('宠物数据格式异常')
  })

  it('可选字段类型不符 → 忽略不设值', () => {
    const pet = parsePetProfile({ ...VALID_PET, currentAccessory: '5' })
    expect(pet.currentAccessory).toBeUndefined()
  })
})

describe('状态换算纯函数', () => {
  it('statusPercent 越界 clamp（负数→0 / 超 100→100 / NaN→0）', () => {
    expect(statusPercent(-10)).toBe(0)
    expect(statusPercent(150)).toBe(100)
    expect(statusPercent(80)).toBe(80)
    expect(statusPercent(Number.NaN)).toBe(0)
    expect(statusPercent(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('statusColor 三段色（≥60 绿 / 30-59 黄 / <30 红）', () => {
    expect(statusColor(60)).toBe('#22c55e')
    expect(statusColor(80)).toBe('#22c55e')
    expect(statusColor(30)).toBe('#eab308')
    expect(statusColor(59)).toBe('#eab308')
    expect(statusColor(29)).toBe('#ef4444')
    expect(statusColor(0)).toBe('#ef4444')
  })

  it('moodLabel 分段（20/40/60/80 边界）', () => {
    expect(moodLabel(100)).toBe('超开心')
    expect(moodLabel(80)).toBe('超开心')
    expect(moodLabel(60)).toBe('开心')
    expect(moodLabel(40)).toBe('一般')
    expect(moodLabel(20)).toBe('有点难过')
    expect(moodLabel(0)).toBe('很伤心')
  })

  it('hungerLabel 分段（数值越高越饱）', () => {
    expect(hungerLabel(90)).toBe('很饱')
    expect(hungerLabel(60)).toBe('微饿')
    expect(hungerLabel(40)).toBe('饿了')
    expect(hungerLabel(20)).toBe('很饿')
    expect(hungerLabel(0)).toBe('快饿扁了')
  })
})

describe('fetchMyPet', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
  })

  it('200 响应 → 校验后返回宠物', async () => {
    apiRequestMock.mockResolvedValue(VALID_PET)
    expect(await fetchMyPet()).toEqual(parsePetProfile(VALID_PET))
    expect(apiRequestMock).toHaveBeenCalledWith('/pets/me')
  })

  it('404 → 返回 null（无宠物业务态，不抛错）', async () => {
    apiRequestMock.mockRejectedValue(Object.assign(new Error('请先创建宠物'), { status: 404 }))
    expect(await fetchMyPet()).toBeNull()
  })

  it('401 → UnauthorizedError 透传', async () => {
    apiRequestMock.mockRejectedValue(new UnauthorizedError())
    await expect(fetchMyPet()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('其他 ≥400 → 后端 message 透传', async () => {
    apiRequestMock.mockRejectedValue(new Error('参数错误'))
    await expect(fetchMyPet()).rejects.toThrow('参数错误')
  })

  it('200 但字段非法 → 抛「宠物数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue({ id: 1, species: 'ORANGE_CAT' })
    await expect(fetchMyPet()).rejects.toThrow('宠物数据格式异常')
  })
})

describe('createPet', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
  })

  it('POST /pets/me + body {species, name} → 校验后返回宠物', async () => {
    apiRequestMock.mockResolvedValue(VALID_PET)
    const pet = await createPet({ species: 'SHIBA_INU', name: '豆豆' })
    expect(apiRequestMock).toHaveBeenCalledWith('/pets/me', { method: 'POST', data: { species: 'SHIBA_INU', name: '豆豆' } })
    expect(pet.name).toBe(VALID_PET.name)
  })

  it('响应非法 → 抛「宠物数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue({ id: 1, species: 'DRAGON', name: 'x' })
    await expect(createPet({ species: 'ORANGE_CAT', name: 'x' })).rejects.toThrow('宠物数据格式异常')
  })
})

describe('interactWithPet', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
  })

  it('POST /pets/me/interact + body {type} → InteractionResult', async () => {
    apiRequestMock.mockResolvedValue({
      moodChange: 5, hungerChange: 15, experienceGain: 8, coinChange: 0,
      newMood: 67, newHunger: 60, newExperience: 128, newCoins: 300,
    })
    const result = await interactWithPet('FEED')
    expect(apiRequestMock).toHaveBeenCalledWith('/pets/me/interact', {
      method: 'POST', data: { type: 'FEED' },
    })
    expect(result.newMood).toBe(67)
    expect(result.moodChange).toBe(5)
  })

  it('PLAY 类型透传 body', async () => {
    apiRequestMock.mockResolvedValue({ moodChange: 3, newMood: 65 })
    await interactWithPet('PLAY')
    expect(apiRequestMock).toHaveBeenCalledWith('/pets/me/interact', {
      method: 'POST', data: { type: 'PLAY' },
    })
  })

  it('响应含非法字段（非 number）→ 抛「宠物数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue({ moodChange: '5' })
    await expect(interactWithPet('FEED')).rejects.toThrow('宠物数据格式异常')
  })

  it('缺失字段 → 归一（结果对象省略 undefined）', async () => {
    apiRequestMock.mockResolvedValue({ newMood: 70 })
    const result = await interactWithPet('FEED')
    expect(result.newMood).toBe(70)
    expect(result.moodChange).toBeUndefined()
  })

  it('字段为 null（后端 Jackson 默认序列化）→ 视为缺省不抛', async () => {
    apiRequestMock.mockResolvedValue({ moodChange: 5, hungerChange: null, experienceGain: null })
    const result = await interactWithPet('FEED')
    expect(result.moodChange).toBe(5)
    expect(result.hungerChange).toBeUndefined()
    expect(result.experienceGain).toBeUndefined()
  })

  it('响应为 null → 抛「宠物数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue(null)
    await expect(interactWithPet('FEED')).rejects.toThrow('宠物数据格式异常')
  })

  it('网络错误 → 原样透传', async () => {
    apiRequestMock.mockRejectedValue(new Error('网络连接失败'))
    await expect(interactWithPet('PLAY')).rejects.toThrow('网络连接失败')
  })
})
