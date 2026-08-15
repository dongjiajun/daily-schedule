import { useEffect } from 'react'
import type { TaskProfile } from '@/api/types.gen'
import { useMoveTask } from '../hooks/useTasks'
import { emitTaskCompleted } from '../lib/taskEvents'
import { TaskColumn } from './TaskColumn'

interface BoardViewProps {
  tasks: TaskProfile[]
  onEdit: (task: TaskProfile) => void
}

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE']

export function BoardView({ tasks, onEdit }: BoardViewProps) {
  const moveTask = useMoveTask()

  useEffect(() => {
    const handler = (e: Event) => {
      const { taskId, newStatus } = (e as CustomEvent).detail as {
        taskId: number
        newStatus: string
      }
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      // 同列拖拽：位置不变（不甩尾）
      if (task.status === newStatus) return

      const maxOrder =
        Math.max(
          ...tasks
            .filter((t) => t.status === newStatus)
            .map((t) => t.sortOrder ?? 0),
          -1
        ) + 1

      moveTask.mutate(
        { id: taskId, data: { status: newStatus as 'TODO' | 'IN_PROGRESS' | 'DONE', sortOrder: maxOrder } },
        {
          onSuccess: () => {
            if (newStatus === 'DONE' && task.title) {
              emitTaskCompleted(String(taskId), task.title)
            }
          },
        }
      )
    }

    window.addEventListener('task-drop', handler)
    return () => window.removeEventListener('task-drop', handler)
  }, [tasks, moveTask])

  const columnTasks = (status: string) =>
    tasks.filter((t) => t.status === status).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <div className="flex gap-4 overflow-x-auto p-4 h-full">
      {COLUMNS.map((status) => (
        <TaskColumn
          key={status}
          status={status}
          tasks={columnTasks(status)}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
