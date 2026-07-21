import { describe, it, expect, beforeEach } from 'vitest'
import { eventBus } from '@/core/lib/eventBus'
import { usePetStore } from '../../store/petStore'
import { registerPetEventListeners, unregisterPetEventListeners } from '../petEventBridge'

describe('petEventBridge', () => {
  beforeEach(() => {
    eventBus.removeAll()
    usePetStore.setState({
      animationState: 'idle',
      bubbleMessage: null,
      menuOpen: false,
      selectionOpen: false,
    })
  })

  it('event:completed 触发 happy', () => {
    registerPetEventListeners()
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: '测试日程' } })

    const state = usePetStore.getState()
    expect(state.animationState).toBe('happy')
    expect(state.bubbleMessage).toContain('测试日程')
  })

  it('event:cancelled 触发 sad', () => {
    registerPetEventListeners()
    eventBus.emit({ type: 'event:cancelled', payload: { eventId: '2', title: '项目评审' } })

    const state = usePetStore.getState()
    expect(state.animationState).toBe('sad')
    expect(state.bubbleMessage).toContain('项目评审')
  })

  it('event:created 触发 happy', () => {
    registerPetEventListeners()
    eventBus.emit({ type: 'event:created', payload: { eventId: '3', title: '新任务' } })

    const state = usePetStore.getState()
    expect(state.animationState).toBe('happy')
    expect(state.bubbleMessage).toContain('新任务')
  })

  it('unregister 后不再响应事件', () => {
    registerPetEventListeners()
    unregisterPetEventListeners()

    eventBus.emit({ type: 'event:completed', payload: { eventId: '4', title: '不应触发' } })
    expect(usePetStore.getState().animationState).toBe('idle')
    expect(usePetStore.getState().bubbleMessage).toBeNull()
  })
})
