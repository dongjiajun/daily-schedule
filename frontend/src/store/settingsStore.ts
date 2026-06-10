import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarView } from './calendarStore'

export interface SettingsState {
  /** 打开应用时的默认日历视图。 */
  defaultView: CalendarView
  /** 新建日程的默认提醒（分钟）；null = 不提醒。 */
  defaultReminderMinutes: number | null
  /** 快速新建（未框选时段）时的默认时长（分钟）。 */
  defaultDurationMinutes: number
  /** 日历上是否显示已完成/已取消的日程。 */
  showCompleted: boolean

  setDefaultView: (view: CalendarView) => void
  setDefaultReminderMinutes: (minutes: number | null) => void
  setDefaultDurationMinutes: (minutes: number) => void
  setShowCompleted: (show: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultView: 'month',
      defaultReminderMinutes: 15,
      defaultDurationMinutes: 60,
      showCompleted: true,

      setDefaultView: (defaultView) => set({ defaultView }),
      setDefaultReminderMinutes: (defaultReminderMinutes) => set({ defaultReminderMinutes }),
      setDefaultDurationMinutes: (defaultDurationMinutes) => set({ defaultDurationMinutes }),
      setShowCompleted: (showCompleted) => set({ showCompleted }),
    }),
    { name: 'settings.v1' }
  )
)
