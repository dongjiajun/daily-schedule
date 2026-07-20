import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../eventBus'
import type { SystemEvent } from '../eventBus'

describe('EventBus', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  it('should register a listener and return an unsubscribe function', () => {
    const handler = vi.fn()
    const unsubscribe = bus.on('event:completed', handler)
    expect(typeof unsubscribe).toBe('function')
  })

  it('should call matching listeners synchronously when emit', () => {
    const handler = vi.fn()
    bus.on('event:completed', handler)

    const event: SystemEvent = {
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    }
    bus.emit(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('should not call listeners for different event types', () => {
    const completedHandler = vi.fn()
    const cancelledHandler = vi.fn()

    bus.on('event:completed', completedHandler)
    bus.on('event:cancelled', cancelledHandler)

    bus.emit({
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    })

    expect(completedHandler).toHaveBeenCalledTimes(1)
    expect(cancelledHandler).not.toHaveBeenCalled()
  })

  it('should allow multiple listeners for the same event type', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('event:completed', handler1)
    bus.on('event:completed', handler2)

    bus.emit({
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    })

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('should remove listener when unsubscribe is called', () => {
    const handler = vi.fn()
    const unsubscribe = bus.on('event:completed', handler)
    unsubscribe()

    bus.emit({
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not fail when emitting with no listeners', () => {
    expect(() => {
      bus.emit({
        type: 'event:completed',
        payload: { eventId: '1', title: 'Test' },
      })
    }).not.toThrow()
  })

  it('should remove listener via off()', () => {
    const handler = vi.fn()
    bus.on('event:completed', handler)
    bus.off('event:completed', handler)

    bus.emit({
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should clear all listeners with removeAll()', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    bus.on('event:completed', handler1)
    bus.on('event:cancelled', handler2)

    bus.removeAll()

    bus.emit({
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    })
    bus.emit({
      type: 'event:cancelled',
      payload: { eventId: '1', title: 'Test' },
    })

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should invoke listeners in registration order (synchronous)', () => {
    const order: number[] = []
    bus.on('event:completed', () => order.push(1))
    bus.on('event:completed', () => order.push(2))
    bus.on('event:completed', () => order.push(3))

    bus.emit({
      type: 'event:completed',
      payload: { eventId: '1', title: 'Test' },
    })

    expect(order).toEqual([1, 2, 3])
  })
})
