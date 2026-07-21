import { create } from 'zustand'

export type ViewMode = 'board' | 'list'

interface TodoState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  viewMode: 'board',
  setViewMode: (viewMode) => set({ viewMode }),
}))
