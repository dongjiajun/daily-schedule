import { create } from 'zustand'
import dayjs from 'dayjs'
import { useSettingsStore } from '../core/store/settingsStore'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

interface CalendarState {
  currentDate: dayjs.Dayjs
  view: CalendarView
  selectedEventId: number | null
  modalOpen: boolean
  editingEventId: number | null
  filterCategoryId: number | null
  filterTagId: number | null
  searchKeyword: string
  defaultStart: string | null
  defaultEnd: string | null

  setCurrentDate: (date: dayjs.Dayjs) => void
  setView: (view: CalendarView) => void
  selectEvent: (id: number | null) => void
  openCreateModal: (start?: string, end?: string) => void
  openEditModal: (id: number) => void
  closeModal: () => void
  setFilterCategory: (id: number | null) => void
  setFilterTag: (id: number | null) => void
  setSearchKeyword: (keyword: string) => void

  showOnboarding: boolean
  openOnboarding: () => void
  closeOnboarding: () => void

  showShortcuts: boolean
  setShowShortcuts: (show: boolean) => void

  showManage: boolean
  manageTab: 'categories' | 'tags' | 'preferences'
  openManage: (tab?: 'categories' | 'tags' | 'preferences') => void
  closeManage: () => void

  /** 移动端侧边栏抽屉。 */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
  currentDate: dayjs(),
  view: useSettingsStore.getState().defaultView,
  selectedEventId: null,
  modalOpen: false,
  editingEventId: null,
  filterCategoryId: null,
  filterTagId: null,
  searchKeyword: '',
  defaultStart: null,
  defaultEnd: null,

  setCurrentDate: (date) => set({ currentDate: date }),
  setView: (view) => set({ view }),
  selectEvent: (id) => set({ selectedEventId: id }),
  openCreateModal: (start, end) =>
    set({ modalOpen: true, editingEventId: null, defaultStart: start ?? null, defaultEnd: end ?? null }),
  openEditModal: (id) => set({ modalOpen: true, editingEventId: id, defaultStart: null, defaultEnd: null }),
  closeModal: () =>
    set({ modalOpen: false, editingEventId: null, selectedEventId: null, defaultStart: null, defaultEnd: null }),
  setFilterCategory: (id) => set({ filterCategoryId: id }),
  setFilterTag: (id) => set({ filterTagId: id }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  showOnboarding: false,
  openOnboarding: () => set({ showOnboarding: true }),
  closeOnboarding: () => {
    localStorage.setItem('onboarding_done', '1')
    set({ showOnboarding: false })
  },

  showShortcuts: false,
  setShowShortcuts: (show) => set({ showShortcuts: show }),

  showManage: false,
  manageTab: 'categories',
  openManage: (tab) => set({ showManage: true, manageTab: tab ?? 'categories' }),
  closeManage: () => set({ showManage: false }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
