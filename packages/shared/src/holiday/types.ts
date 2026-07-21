export interface Holiday {
  id: string
  name: string
  englishName: string
  layer: HolidayLayer
  category: HolidayCategory
  priority: number
  dateRange: [string, string]
  locale?: string[]
  theme?: HolidayTheme
}

export const HolidayLayer = {
  FIXED_SOLAR: 'FIXED_SOLAR',
  FLOATING_SOLAR: 'FLOATING_SOLAR',
  LUNAR: 'LUNAR',
  REGIONAL: 'REGIONAL',
} as const

export type HolidayLayer = (typeof HolidayLayer)[keyof typeof HolidayLayer]

export type HolidayCategory = 'TRADITIONAL' | 'RELIGIOUS' | 'SECULAR' | 'REGIONAL'

export interface HolidayTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  effectType: EffectType
  intensity: 'subtle' | 'moderate' | 'festive'
  petAccessory?: string
}

export type EffectType = 'firework' | 'snow' | 'petal' | 'leaf' | 'lantern' | 'heart' | 'none'
