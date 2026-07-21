import { create } from 'zustand'

export type AnimationState = 'idle' | 'happy' | 'sad' | 'hungry'

interface PetStore {
  animationState: AnimationState
  bubbleMessage: string | null
  menuOpen: boolean
  selectionOpen: boolean

  triggerAnimation: (state: AnimationState) => void
  showBubble: (msg: string) => void
  clearBubble: () => void
  setMenuOpen: (open: boolean) => void
  setSelectionOpen: (open: boolean) => void
}

export const usePetStore = create<PetStore>((set) => ({
  animationState: 'idle',
  bubbleMessage: null,
  menuOpen: false,
  selectionOpen: false,

  triggerAnimation: (state) => {
    set({ animationState: state })
    if (state === 'happy' || state === 'sad') {
      setTimeout(() => set({ animationState: 'idle' }), 5000)
    }
  },

  showBubble: (msg) => {
    set({ bubbleMessage: msg })
    setTimeout(() => set({ bubbleMessage: null }), 4000)
  },

  clearBubble: () => set({ bubbleMessage: null }),

  setMenuOpen: (open) => set({ menuOpen: open }),

  setSelectionOpen: (open) => set({ selectionOpen: open }),
}))
