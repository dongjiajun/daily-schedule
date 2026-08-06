import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePetStore } from '../petStore'

describe('petStore', () => {
  beforeEach(() => {
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
})
