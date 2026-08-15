import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePetStore, clampPositionToViewport } from '../petStore'

const STORAGE_KEY = 'pet-roaming-state'

function readPersisted(): { state: Record<string, unknown>; version: number } | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

describe('petStore', () => {
  beforeEach(() => {
    localStorage.clear()
    usePetStore.getState().reset()
    vi.useFakeTimers()
  })

  it('初始状态正确', () => {
    const s = usePetStore.getState()
    expect(s.emotionState).toBe('idle')
    expect(s.animationState).toBe('idle')
    expect(s.bubbleMessage).toBeNull()
    expect(s.selectionOpen).toBe(false)
    expect(s.comboCount).toBe(0)
    expect(s.isResting).toBe(false)
    expect(s.feedbackTrigger).toBeNull()
  })

  it('setAction 定时后自动回 idle', () => {
    usePetStore.getState().setAction('jump', 600)
    expect(usePetStore.getState().action).toBe('jump')

    vi.advanceTimersByTime(600)
    expect(usePetStore.getState().action).toBe('idle')
  })

  it('eat/小动作类型 setAction 定时后自动回 idle', () => {
    const store = usePetStore.getState()
    store.setAction('eat', 1500)
    expect(usePetStore.getState().action).toBe('eat')

    vi.advanceTimersByTime(1500)
    expect(usePetStore.getState().action).toBe('idle')

    store.setAction('yawn', 1800)
    expect(usePetStore.getState().action).toBe('yawn')

    vi.advanceTimersByTime(1800)
    expect(usePetStore.getState().action).toBe('idle')
  })

  it('action 与 emotion 正交并存', () => {
    const store = usePetStore.getState()
    store.setAction('walk')
    store.setEmotion('happy', 3000)
    expect(usePetStore.getState().action).toBe('walk')
    expect(usePetStore.getState().emotionState).toBe('happy')
  })

  it('reset 清理 action 状态', () => {
    usePetStore.getState().setAction('sleep')
    usePetStore.getState().reset()
    expect(usePetStore.getState().action).toBe('idle')
  })

  it('triggerFeedback 设置并清除浮动数值', () => {
    usePetStore.getState().triggerFeedback([
      { text: '+20 饱腹', tone: 'good' },
      { text: '-10 金币', tone: 'bad' },
    ])
    const trigger = usePetStore.getState().feedbackTrigger
    expect(trigger).not.toBeNull()
    expect(trigger!.items).toHaveLength(2)
    expect(trigger!.items[0].text).toBe('+20 饱腹')

    usePetStore.getState().clearFeedback()
    expect(usePetStore.getState().feedbackTrigger).toBeNull()
  })

  it('setEmotion 定时后自动回 idle', () => {
    usePetStore.getState().setEmotion('happy', 3000)
    expect(usePetStore.getState().emotionState).toBe('happy')

    vi.advanceTimersByTime(3000)
    expect(usePetStore.getState().emotionState).toBe('idle')
  })

  it('setEmotion 无 duration 不会自动回 idle', () => {
    usePetStore.getState().setEmotion('idle')
    expect(usePetStore.getState().emotionState).toBe('idle')

    vi.advanceTimersByTime(10000)
    expect(usePetStore.getState().emotionState).toBe('idle')
  })

  it('triggerAnimation 兼容旧 API', () => {
    usePetStore.getState().triggerAnimation('happy')
    expect(usePetStore.getState().emotionState).toBe('happy')
    expect(usePetStore.getState().animationState).toBe('happy')

    vi.advanceTimersByTime(5000)
    expect(usePetStore.getState().emotionState).toBe('idle')
  })

  it('showBubble 后 4s 自动清除', () => {
    usePetStore.getState().showBubble('测试消息')
    expect(usePetStore.getState().bubbleMessage).toBe('测试消息')

    vi.advanceTimersByTime(4000)
    expect(usePetStore.getState().bubbleMessage).toBeNull()
  })

  it('combo 计数正确触发 excited', () => {
    const store = usePetStore.getState()
    store.incrementCombo() // 1
    expect(usePetStore.getState().comboCount).toBe(1)
    expect(usePetStore.getState().emotionState).toBe('happy')

    store.incrementCombo() // 2
    expect(usePetStore.getState().comboCount).toBe(2)
    expect(usePetStore.getState().emotionState).toBe('happy')

    store.incrementCombo() // 3 → excited!
    expect(usePetStore.getState().comboCount).toBe(3)
    expect(usePetStore.getState().emotionState).toBe('excited')
  })

  it('resetCombo 清空连击', () => {
    const store = usePetStore.getState()
    store.incrementCombo()
    store.incrementCombo()
    store.incrementCombo()
    expect(usePetStore.getState().comboCount).toBe(3)

    store.resetCombo()
    expect(usePetStore.getState().comboCount).toBe(0)
  })

  it('游走位置设置', () => {
    usePetStore.getState().setPosition({ x: 500, y: 300 })
    expect(usePetStore.getState().position).toEqual({ x: 500, y: 300 })
  })

  it('朝向设置', () => {
    usePetStore.getState().setFacing('left')
    expect(usePetStore.getState().facing).toBe('left')
  })

  it('休息/唤醒状态', () => {
    usePetStore.getState().startResting()
    expect(usePetStore.getState().isResting).toBe(true)

    usePetStore.getState().wakeUp()
    expect(usePetStore.getState().isResting).toBe(false)
  })

  // ─── 持久化（pet-state-persist） ───

  it('游走状态变化写入 localStorage（白名单字段）', () => {
    usePetStore.getState().setPosition({ x: 500, y: 300 })
    usePetStore.getState().setFacing('left')
    usePetStore.getState().startResting()

    const persisted = readPersisted()
    expect(persisted).not.toBeNull()
    expect(persisted!.version).toBe(1)
    expect(persisted!.state.position).toEqual({ x: 500, y: 300 })
    expect(persisted!.state.facing).toBe('left')
    expect(persisted!.state.isResting).toBe(true)
  })

  it('rehydrate 恢复持久化状态', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: { position: { x: 555, y: 222 }, facing: 'left', isResting: true, emotionState: 'sleepy' },
      version: 1,
    }))

    await usePetStore.persist.rehydrate()

    const s = usePetStore.getState()
    expect(s.position).toEqual({ x: 555, y: 222 })
    expect(s.facing).toBe('left')
    expect(s.isResting).toBe(true)
    expect(s.emotionState).toBe('sleepy')
  })

  it('瞬态情绪归一为 idle（稳定情绪原样落盘）', () => {
    usePetStore.getState().setEmotion('happy', 5000)
    expect(readPersisted()!.state.emotionState).toBe('idle')

    usePetStore.getState().setEmotion('sleepy')
    expect(readPersisted()!.state.emotionState).toBe('sleepy')

    usePetStore.getState().setEmotion('excited', 5000)
    expect(readPersisted()!.state.emotionState).toBe('idle')
  })

  it('瞬态字段不落盘（action/粒子/气泡/连击）', () => {
    usePetStore.getState().setAction('eat', 1500)
    usePetStore.getState().triggerParticle('coins')
    usePetStore.getState().showBubble('测试')
    usePetStore.getState().incrementCombo()

    const persistedState = readPersisted()!.state
    expect(persistedState).not.toHaveProperty('action')
    expect(persistedState).not.toHaveProperty('particleTrigger')
    expect(persistedState).not.toHaveProperty('bubbleMessage')
    expect(persistedState).not.toHaveProperty('comboCount')
    expect(persistedState).not.toHaveProperty('stateTimer')
  })

  it('clampPositionToViewport 越界钳制回视口（jsdom 视口 1024×768）', () => {
    expect(clampPositionToViewport({ x: 3000, y: 500 })).toEqual({ x: 1024 - 90, y: 500 })
    expect(clampPositionToViewport({ x: -50, y: -20 })).toEqual({ x: 0, y: 0 })
    expect(clampPositionToViewport({ x: 200, y: 100 })).toEqual({ x: 200, y: 100 })
  })

  it('rehydrate 时越界位置被钳制', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: { position: { x: 5000, y: 9000 }, facing: 'right', isResting: false, emotionState: 'idle' },
      version: 1,
    }))

    await usePetStore.persist.rehydrate()

    const s = usePetStore.getState()
    expect(s.position.x).toBeLessThanOrEqual(1024 - 90)
    expect(s.position.y).toBeLessThanOrEqual(768 - 90)
  })

  it('无持久化记录时 rehydrate 使用默认值', async () => {
    usePetStore.setState({ position: { x: 777, y: 666 }, facing: 'left' })
    await usePetStore.persist.rehydrate()

    // 无记录：persist 跳过恢复，当前内存状态保持
    const s = usePetStore.getState()
    expect(s.position).toEqual({ x: 777, y: 666 })
  })

  it('reset 后持久化记录为默认值', () => {
    usePetStore.getState().setPosition({ x: 900, y: 500 })
    usePetStore.getState().reset()

    const persisted = readPersisted()!
    expect(persisted.state.position).toEqual({ x: 100, y: 100 })
    expect(persisted.state.facing).toBe('right')
    expect(persisted.state.isResting).toBe(false)
  })
})
