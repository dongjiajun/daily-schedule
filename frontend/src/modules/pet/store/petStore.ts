import { create } from 'zustand'

export type EmotionState = 'idle' | 'idle_variant' | 'happy' | 'sad' | 'hungry' | 'sleepy' | 'excited' | 'surprised'
export type ParticleType = 'hearts' | 'stars' | 'coins' | 'sparkles'

export interface Position {
  x: number
  y: number
}

interface PetStore {
  // ── 情绪状态机 ──
  /** 保留旧名兼容 */
  animationState: EmotionState
  emotionState: EmotionState
  previousEmotion: EmotionState | null
  stateTimer: ReturnType<typeof setTimeout> | null

  // ── 气泡 ──
  bubbleMessage: string | null

  // ── 菜单/选择 ──
  menuOpen: boolean
  selectionOpen: boolean

  // ── 游走 ──
  position: Position
  targetPosition: Position | null
  facing: 'left' | 'right'
  isResting: boolean

  // ── 粒子触发器（事件总线驱动） ──
  particleTrigger: { type: ParticleType; timestamp: number } | null

  // ── 主动行为 ──
  idleVariantTimer: ReturnType<typeof setTimeout> | null
  lastInteractionTime: number
  comboCount: number

  // ── 旧 API 兼容 ──
  triggerAnimation: (state: EmotionState) => void

  // ── 情绪 Actions ──
  setEmotion: (state: EmotionState, duration?: number) => void
  incrementCombo: () => void
  resetCombo: () => void

  // ── 气泡 Actions ──
  showBubble: (msg: string) => void
  clearBubble: () => void

  // ── 菜单/选择 Actions ──
  setMenuOpen: (open: boolean) => void
  setSelectionOpen: (open: boolean) => void

  // ── 游走 Actions ──
  setPosition: (pos: Position) => void
  setTargetPosition: (pos: Position | null) => void
  setFacing: (dir: 'left' | 'right') => void
  startResting: () => void
  wakeUp: () => void

  // ── 粒子触发 ──
  triggerParticle: (type: ParticleType) => void
  clearParticleTrigger: () => void

  // ── 生命周期 ──
  reset: () => void
}

export const usePetStore = create<PetStore>((set, get) => ({
  // ── 初始值 ──
  animationState: 'idle',
  emotionState: 'idle',
  previousEmotion: null,
  stateTimer: null,

  bubbleMessage: null,
  menuOpen: false,
  selectionOpen: false,

  position: { x: 100, y: 100 },
  targetPosition: null,
  facing: 'right',
  isResting: false,

  particleTrigger: null,

  idleVariantTimer: null,
  lastInteractionTime: Date.now(),
  comboCount: 0,

  // ── 旧 API 兼容 ──
  triggerAnimation: (state) => {
    get().setEmotion(state, state === 'happy' || state === 'sad' ? 5000 : undefined)
  },

  // ── 情绪 ──
  setEmotion: (state, duration) => {
    const current = get()
    // 清除之前的定时器
    if (current.stateTimer) clearTimeout(current.stateTimer)

    const newTimer = duration
      ? setTimeout(() => {
          set({
            emotionState: 'idle',
            animationState: 'idle',
            previousEmotion: state,
            stateTimer: null,
          })
        }, duration)
      : null

    set({
      emotionState: state,
      animationState: state,
      previousEmotion: current.emotionState,
      stateTimer: newTimer,
      lastInteractionTime: Date.now(),
      isResting: false,
    })
  },

  incrementCombo: () => {
    const newCombo = get().comboCount + 1
    set({ comboCount: newCombo })
    if (newCombo >= 3) {
      get().setEmotion('excited', 5000)
    } else {
      get().setEmotion('happy', 5000)
    }
  },

  resetCombo: () => set({ comboCount: 0 }),

  // ── 气泡 ──
  showBubble: (msg) => {
    set({ bubbleMessage: msg })
    setTimeout(() => {
      const current = get()
      if (current.bubbleMessage === msg) {
        set({ bubbleMessage: null })
      }
    }, 4000)
  },

  clearBubble: () => set({ bubbleMessage: null }),

  // ── 菜单/选择 ──
  setMenuOpen: (open) => set({ menuOpen: open }),
  setSelectionOpen: (open) => set({ selectionOpen: open }),

  // ── 游走 ──
  setPosition: (pos) => set({ position: pos }),
  setTargetPosition: (pos) => set({ targetPosition: pos }),
  setFacing: (dir) => set({ facing: dir }),
  startResting: () => set({ isResting: true }),
  wakeUp: () => set({ isResting: false, lastInteractionTime: Date.now() }),

  // ── 粒子触发 ──
  triggerParticle: (type) => set({ particleTrigger: { type, timestamp: Date.now() } }),
  clearParticleTrigger: () => set({ particleTrigger: null }),

  // ── 生命周期 ──
  reset: () => {
    const current = get()
    if (current.stateTimer) clearTimeout(current.stateTimer)
    if (current.idleVariantTimer) clearTimeout(current.idleVariantTimer)
    set({
      animationState: 'idle',
      emotionState: 'idle',
      previousEmotion: null,
      stateTimer: null,
      bubbleMessage: null,
      menuOpen: false,
      selectionOpen: false,
      position: { x: 100, y: 100 },
      targetPosition: null,
      facing: 'right',
      isResting: false,
      idleVariantTimer: null,
      lastInteractionTime: Date.now(),
      comboCount: 0,
    })
  },
}))
