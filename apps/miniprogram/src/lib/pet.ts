import { apiRequest } from './api'

/**
 * 宠物数据层（小程序宠物互动）。
 *
 * 复用后端 `/pets/me` 系列端点（GET / POST / POST interact），消费 PetProfile /
 * InteractionResult；响应做字段校验（纯函数可单测）。
 * 404 语义：GET /pets/me 返回 404 = 当前用户尚无宠物（业务态）→ 映射为 null，
 * 页面据此进入创建引导而非错误态（对齐 Web 端 useMyPet 的 404 不重试语义）。
 * 状态换算（百分比条/三段色/中文标签）为纯函数：小黄红三段色对齐 Web 端
 * statusColor（≥60 绿 / 30-59 黄 / <30 红），mock 无法覆盖的渲染由 smoke 验证。
 */

export type PetSpecies = 'ORANGE_CAT' | 'SHIBA_INU'
export type InteractType = 'FEED' | 'PLAY'

export interface PetProfile {
  id: number
  species: PetSpecies
  name: string
  experience: number
  level: number
  mood: number
  hunger: number
  coins: number
  currentAccessory?: number
  lastInteractedAt?: string
  createdAt?: string
}

export interface InteractionResult {
  moodChange?: number
  hungerChange?: number
  experienceGain?: number
  coinChange?: number
  newMood?: number
  newHunger?: number
  newExperience?: number
  newCoins?: number
}

const PET_SPECIES: readonly string[] = ['ORANGE_CAT', 'SHIBA_INU']

/** 物种展示元数据（中文标签 + emoji 形象 + 圈底色） */
export const SPECIES_META: Record<PetSpecies, { label: string; emoji: string; color: string }> = {
  ORANGE_CAT: { label: '懒猫', emoji: '🐱', color: '#fa8c16' },
  SHIBA_INU: { label: '柴犬', emoji: '🐕', color: '#8c8c8c' },
}

/** 校验并规范化 PetProfile（字段缺失/类型不符/物种非法时抛「宠物数据格式异常」） */
export function parsePetProfile(raw: unknown): PetProfile {
  const p = (raw ?? {}) as Record<string, unknown>
  const id = p.id
  const species = p.species
  const name = p.name
  const experience = p.experience
  const level = p.level
  const mood = p.mood
  const hunger = p.hunger
  const coins = p.coins
  if (typeof id !== 'number'
      || typeof species !== 'string' || !PET_SPECIES.includes(species)
      || typeof name !== 'string' || name === ''
      || typeof experience !== 'number'
      || typeof level !== 'number'
      || typeof mood !== 'number'
      || typeof hunger !== 'number'
      || typeof coins !== 'number') {
    throw new Error('宠物数据格式异常')
  }
  const pet: PetProfile = {
    id, species: species as PetSpecies, name, experience, level, mood, hunger, coins,
  }
  if (typeof p.currentAccessory === 'number') pet.currentAccessory = p.currentAccessory
  if (typeof p.lastInteractedAt === 'string') pet.lastInteractedAt = p.lastInteractedAt
  if (typeof p.createdAt === 'string') pet.createdAt = p.createdAt
  return pet
}

/** 状态值 → 条宽百分比（clamp 0-100，非法值兜底 0） */
export function statusPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** 状态三段色（对齐 Web 端 statusColor）：≥60 绿 / 30-59 黄 / <30 红 */
export function statusColor(value: number): string {
  if (value >= 60) return '#22c55e'
  if (value >= 30) return '#eab308'
  return '#ef4444'
}

/** 心情值 → 中文标签（0-100） */
export function moodLabel(value: number): string {
  if (value >= 80) return '超开心'
  if (value >= 60) return '开心'
  if (value >= 40) return '一般'
  if (value >= 20) return '有点难过'
  return '很伤心'
}

/** 饥饿值 → 中文标签（0-100，数值越高越饱） */
export function hungerLabel(value: number): string {
  if (value >= 80) return '很饱'
  if (value >= 60) return '微饿'
  if (value >= 40) return '饿了'
  if (value >= 20) return '很饿'
  return '快饿扁了'
}

/**
 * 拉取当前用户宠物：200 → PetProfile（校验后）；404 → null（无宠物业务态）；
 * 其余 ≥400 抛后端 message、401 抛 UnauthorizedError（沿用 apiRequest 语义）。
 */
export async function fetchMyPet(): Promise<PetProfile | null> {
  try {
    return parsePetProfile(await apiRequest<unknown>('/pets/me'))
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null
    throw err
  }
}

/** 创建宠物（species 必选 + name 必填 maxLength 30，服务端校验兜底） */
export async function createPet(input: { species: PetSpecies; name: string }): Promise<PetProfile> {
  return parsePetProfile(await apiRequest<unknown>('/pets/me', { method: 'POST', data: input }))
}

/**
 * 与宠物互动（FEED 用默认最便宜食物，不传 itemId/quantity；PLAY 玩耍）。
 * 成功后返回 InteractionResult（变化量 + 新值），由页面同步展示并 refetch 对账。
 */
export async function interactWithPet(type: InteractType): Promise<InteractionResult> {
  const data = await apiRequest<unknown>('/pets/me/interact', { method: 'POST', data: { type } })
  const p = data as Record<string, unknown> | undefined
  if (p === undefined || p === null) throw new Error('宠物数据格式异常')
  const result: InteractionResult = {}
  const raw = {
    moodChange: p.moodChange, hungerChange: p.hungerChange, experienceGain: p.experienceGain,
    coinChange: p.coinChange, newMood: p.newMood, newHunger: p.newHunger,
    newExperience: p.newExperience, newCoins: p.newCoins,
  }
  for (const [key, value] of Object.entries(raw)) {
    // null 视为缺省（后端 Jackson 默认序列化 null，与 tasks.ts 同一坑位）
    if (value != null && typeof value !== 'number') {
      throw new Error('宠物数据格式异常')
    }
    if (value != null) (result as Record<string, number>)[key] = value as number
  }
  return result
}
