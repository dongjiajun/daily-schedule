import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '../eventBus'

describe('eventBus (singleton)', () => {
  beforeEach(() => {
    eventBus.removeAll()
  })

  it('应正确导出 EventBus 单例', () => {
    expect(eventBus).toBeDefined()
    expect(typeof eventBus.on).toBe('function')
    expect(typeof eventBus.emit).toBe('function')
    expect(typeof eventBus.off).toBe('function')
    expect(typeof eventBus.removeAll).toBe('function')
  })

  it('on() 注册监听并返回注销函数', () => {
    const handler = vi.fn()
    const unsubscribe = eventBus.on('event:completed', handler)
    expect(typeof unsubscribe).toBe('function')
  })

  it('emit 触发已注册的监听器', () => {
    const handler = vi.fn()
    eventBus.on('event:completed', handler)
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: 'Test' } })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('off() 注销后不再触发', () => {
    const handler = vi.fn()
    eventBus.on('event:completed', handler)
    eventBus.off('event:completed', handler)
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: 'Test' } })
    expect(handler).not.toHaveBeenCalled()
  })

  it('removeAll() 清除所有监听', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    eventBus.on('event:completed', h1)
    eventBus.on('event:cancelled', h2)
    eventBus.removeAll()
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: 'Test' } })
    eventBus.emit({ type: 'event:cancelled', payload: { eventId: '2', title: 'Test' } })
    expect(h1).not.toHaveBeenCalled()
    expect(h2).not.toHaveBeenCalled()
  })

  it('多个监听器同时触发', () => {
    const order: number[] = []
    eventBus.on('event:completed', () => order.push(1))
    eventBus.on('event:completed', () => order.push(2))
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: 'Test' } })
    expect(order).toEqual([1, 2])
  })
})
