import { describe, it, expect, vi } from 'vitest'
import { eventBus } from '@/core/lib/eventBus'
import { emitTaskCompleted, emitTaskCreated } from '../taskEvents'

describe('taskEvents', () => {
  it('emitTaskCompleted 发出正确的事件', () => {
    const handler = vi.fn()
    const unsub = eventBus.on('task:completed', handler)

    emitTaskCompleted('1', '测试任务')

    expect(handler).toHaveBeenCalledWith({
      type: 'task:completed',
      payload: { taskId: '1', title: '测试任务' },
    })

    unsub()
  })

  it('emitTaskCreated 发出正确的事件', () => {
    const handler = vi.fn()
    const unsub = eventBus.on('task:created', handler)

    emitTaskCreated('42')

    expect(handler).toHaveBeenCalledWith({
      type: 'task:created',
      payload: { taskId: '42' },
    })

    unsub()
  })
})
