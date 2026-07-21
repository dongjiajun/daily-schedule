import { eventBus } from '@/core/lib/eventBus'

export function emitTaskCompleted(taskId: string, title: string) {
  eventBus.emit({ type: 'task:completed', payload: { taskId, title } })
}

export function emitTaskCreated(taskId: string) {
  eventBus.emit({ type: 'task:created', payload: { taskId } })
}
