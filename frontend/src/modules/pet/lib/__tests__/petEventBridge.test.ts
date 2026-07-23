import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { eventBus } from '@/core/lib/eventBus'
import { usePetStore } from '../../store/petStore'
import { registerPetEventListeners, unregisterPetEventListeners } from '../petEventBridge'

describe('petEventBridge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    eventBus.removeAll()
    usePetStore.setState({
      animationState: 'idle',
      emotionState: 'idle',
      bubbleMessage: null,
      comboCount: 0,
      particleTrigger: null,
      position: { x: 500, y: 300 },
    })
    registerPetEventListeners()
  })

  afterEach(() => {
    unregisterPetEventListeners()
    vi.useRealTimers()
  })

  it('event:completed 触发 happy + 连击 + 粒子', () => {
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: '测试日程' } })

    const state = usePetStore.getState()
    expect(state.emotionState).toBe('happy')
    expect(state.comboCount).toBe(1)
    // 粒子触发器已设置
    expect(state.particleTrigger).not.toBeNull()
    expect(state.particleTrigger!.type).toBe('stars')

    // bubble 延迟 300ms
    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toBe('太棒了！「测试日程」已完成！🎉')
  })

  it('task:completed 触发 happy + 连击 + 粒子', () => {
    eventBus.emit({ type: 'task:completed', payload: { taskId: '1', title: '写报告' } })

    const state = usePetStore.getState()
    expect(state.emotionState).toBe('happy')
    expect(state.comboCount).toBe(1)
    expect(state.particleTrigger).not.toBeNull()
    expect(state.particleTrigger!.type).toBe('stars')

    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toBe('任务「写报告」完成！你真棒！✅')
  })

  it('event:cancelled 触发 sad + 重置连击', () => {
    usePetStore.getState().incrementCombo()
    eventBus.emit({ type: 'event:cancelled', payload: { eventId: '2', title: '项目评审' } })

    expect(usePetStore.getState().emotionState).toBe('sad')
    expect(usePetStore.getState().comboCount).toBe(0)

    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toBe('「项目评审」取消了…')
  })

  it('event:created 触发 happy', () => {
    eventBus.emit({ type: 'event:created', payload: { eventId: '3', title: '新任务' } })

    expect(usePetStore.getState().emotionState).toBe('happy')

    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toContain('新任务')
  })

  it('3 连击触发 excited', () => {
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: 'A' } })
    eventBus.emit({ type: 'event:completed', payload: { eventId: '2', title: 'B' } })
    eventBus.emit({ type: 'event:completed', payload: { eventId: '3', title: 'C' } })

    expect(usePetStore.getState().comboCount).toBe(3)
    expect(usePetStore.getState().emotionState).toBe('excited')
    // 3 次都有粒子
    expect(usePetStore.getState().particleTrigger).not.toBeNull()
  })

  it('unregister 后不再响应事件', () => {
    unregisterPetEventListeners()

    eventBus.emit({ type: 'event:completed', payload: { eventId: '4', title: '不应触发' } })
    expect(usePetStore.getState().emotionState).toBe('idle')
    expect(usePetStore.getState().bubbleMessage).toBeNull()
    expect(usePetStore.getState().particleTrigger).toBeNull()
  })
})
