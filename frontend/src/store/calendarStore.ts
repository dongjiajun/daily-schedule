import { create } from 'zustand'
import dayjs from 'dayjs'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

interface CalendarState {
  currentDate: dayjs.Dayjs
  view: CalendarView
  selectedEventId: number | null
  modalOpen: boolean
  editingEventId: number | null
  filterCategoryId: number | null
  defaultStart: string | null
  defaultEnd: string | null

  setCurrentDate: (date: dayjs.Dayjs) => void
  setView: (view: CalendarView) => void
  selectEvent: (id: number | null) => void
  openCreateModal: (start?: string, end?: string) => void
  openEditModal: (id: number) => void
  closeModal: () => void
  setFilterCategory: (id: number | null) => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
  currentDate: dayjs(),
  view: 'month',
  selectedEventId: null,
  modalOpen: false,
  editingEventId: null,
  filterCategoryId: null,
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
}))
