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

  setCurrentDate: (date: dayjs.Dayjs) => void
  setView: (view: CalendarView) => void
  selectEvent: (id: number | null) => void
  openCreateModal: () => void
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

  setCurrentDate: (date) => set({ currentDate: date }),
  setView: (view) => set({ view }),
  selectEvent: (id) => set({ selectedEventId: id }),
  openCreateModal: () => set({ modalOpen: true, editingEventId: null }),
  openEditModal: (id) => set({ modalOpen: true, editingEventId: id }),
  closeModal: () => set({ modalOpen: false, editingEventId: null, selectedEventId: null }),
  setFilterCategory: (id) => set({ filterCategoryId: id }),
}))
