import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarView } from '@/modules/calendar/store/calendarStore'

export type ThemePreset = 'default' | 'warm' | 'nature' | 'dark' | 'lavender'

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

  setDefaultView: (view: CalendarView) => void
  setDefaultReminderMinutes: (minutes: number | null) => void
  setDefaultDurationMinutes: (minutes: number) => void
  setShowCompleted: (show: boolean) => void
  setTheme: (theme: ThemePreset) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultView: 'month',
      defaultReminderMinutes: 15,
      defaultDurationMinutes: 60,
      showCompleted: true,
      theme: 'default',

      setDefaultView: (defaultView) => set({ defaultView }),
      setDefaultReminderMinutes: (defaultReminderMinutes) => set({ defaultReminderMinutes }),
      setDefaultDurationMinutes: (defaultDurationMinutes) => set({ defaultDurationMinutes }),
      setShowCompleted: (showCompleted) => set({ showCompleted }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'settings.v1' }
  )
)
