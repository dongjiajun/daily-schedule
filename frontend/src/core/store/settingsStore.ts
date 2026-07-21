import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarView } from '@/modules/calendar/store/calendarStore'

export type ThemePreset = 'default' | 'warm' | 'nature' | 'dark' | 'lavender'
export type ThemeMode = 'manual' | 'auto'
export type EffectIntensity = 'off' | 'low' | 'full'

export const THEME_LABELS: Record<ThemePreset, string> = {
  default: '默认蓝灰',
  warm: '暖琥珀',
  nature: '森林绿',
  dark: '深色模式',
  lavender: '薰衣草紫',
}

/** 主题预览色（用于选择器中的颜色 Dot） */
export const THEME_COLORS: Record<ThemePreset, string> = {
  default: '#3b82f6',
  warm: '#d97706',
  nature: '#166534',
  dark: '#334155',
  lavender: '#8b5cf6',
}

export interface SettingsState {
  /** 打开应用时的默认日历视图。 */
  defaultView: CalendarView
  /** 新建日程的默认提醒（分钟）；null = 不提醒。 */
  defaultReminderMinutes: number | null
  /** 快速新建（未框选时段）时的默认时长（分钟）。 */
  defaultDurationMinutes: number
  /** 日历上是否显示已完成/已取消的日程。 */
  showCompleted: boolean
  /** 当前主题预设。 */
  theme: ThemePreset
  /** 主题模式：manual（手动选择）/ auto（根据节日自动切换）。默认 manual */
  themeMode: ThemeMode
  /** 特效强度：off（关闭）/ low（低密度，默认）/ full（全密度）。 */
  effectIntensity: EffectIntensity
  /** 是否根据系统偏好自动切换暗黑模式。默认 false。 */
  autoDarkMode: boolean
  /** 地区设置（用于地区性节日匹配）。默认 'CN'。 */
  locale: string
  /** 上次检测节日的日期 (YYYY-MM-DD)，用于日缓存。 */
  holidayCheckDate: string | null
  /** 当前活跃节日 id（无节日时为 null）。 */
  activeHolidayId: string | null

  setDefaultView: (view: CalendarView) => void
  setDefaultReminderMinutes: (minutes: number | null) => void
  setDefaultDurationMinutes: (minutes: number) => void
  setShowCompleted: (show: boolean) => void
  setTheme: (theme: ThemePreset) => void
  setThemeMode: (mode: ThemeMode) => void
  setEffectIntensity: (intensity: EffectIntensity) => void
  setAutoDarkMode: (enabled: boolean) => void
  setLocale: (locale: string) => void
  setHolidayCheckResult: (date: string, holidayId: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultView: 'month',
      defaultReminderMinutes: 15,
      defaultDurationMinutes: 60,
      showCompleted: true,
      theme: 'default',
      themeMode: 'manual',
      effectIntensity: 'low',
      autoDarkMode: false,
      locale: 'CN',
      holidayCheckDate: null,
      activeHolidayId: null,

      setDefaultView: (defaultView) => set({ defaultView }),
      setDefaultReminderMinutes: (defaultReminderMinutes) => set({ defaultReminderMinutes }),
      setDefaultDurationMinutes: (defaultDurationMinutes) => set({ defaultDurationMinutes }),
      setShowCompleted: (showCompleted) => set({ showCompleted }),
      setTheme: (theme) => set({ theme }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setEffectIntensity: (effectIntensity) => set({ effectIntensity }),
      setAutoDarkMode: (autoDarkMode) => set({ autoDarkMode }),
      setLocale: (locale) => set({ locale }),
      setHolidayCheckResult: (holidayCheckDate, activeHolidayId) => set({ holidayCheckDate, activeHolidayId }),
    }),
    {
      name: 'settings.v1',
      partialize: (state) => ({
        defaultView: state.defaultView,
        defaultReminderMinutes: state.defaultReminderMinutes,
        defaultDurationMinutes: state.defaultDurationMinutes,
        showCompleted: state.showCompleted,
        theme: state.theme,
        themeMode: state.themeMode,
        effectIntensity: state.effectIntensity,
        autoDarkMode: state.autoDarkMode,
        locale: state.locale,
      }),
    }
  )
)
