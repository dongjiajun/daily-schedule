import type { TaskProfile } from '@/api/types.gen'
import { useCreateTask } from '../hooks/useTasks'
import { emitTaskCreated } from '../lib/taskEvents'
import { TaskCard } from './TaskCard'
import { useState } from 'react'

const columnConfig: Record<string, { title: string; icon: string; color: string }> = {
  TODO: { title: '待办', icon: '📋', color: 'border-blue-300' },
  IN_PROGRESS: { title: '进行中', icon: '🚀', color: 'border-amber-300' },
  DONE: { title: '已完成', icon: '✅', color: 'border-green-300' },
}

interface TaskColumnProps {
  status: string
  tasks: TaskProfile[]
  onEdit: (task: TaskProfile) => void
}

export function TaskColumn({ status, tasks, onEdit }: TaskColumnProps) {
  const config = columnConfig[status] ?? { title: status, icon: '📌', color: 'border-gray-300' }
  const createTask = useCreateTask()
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    try {
      const result = await createTask.mutateAsync({ title: newTitle.trim() })
      emitTaskCreated(String(result.id!))
      setNewTitle('')
      setIsAdding(false)
    } catch {
      // toast is handled by the mutation
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      // Emit custom event for BoardView to handle
      const event = new CustomEvent('task-drop', {
        detail: { taskId: Number(taskId), newStatus: status },
      })
      window.dispatchEvent(event)
    }
  }

  return (
    <div
      className={`flex flex-col w-80 min-w-[280px] bg-gray-50 dark:bg-gray-900 rounded-lg border-2 transition-colors ${isDragOver ? `${config.color} border-dashed` : 'border-transparent'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">
          {config.icon} {config.title}
          <span className="ml-2 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          + 新建
        </button>
      </div>

      {/* Quick add input */}
      {isAdding && (
        <div className="px-3 py-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            placeholder="输入任务标题，回车创建…"
            className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
            autoFocus
          />
        </div>
      )}

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
        {tasks.length === 0 && !isAdding && (
          <p className="text-xs text-gray-400 text-center py-4">
            {status === 'TODO' ? '暂无待办任务' : status === 'IN_PROGRESS' ? '暂无进行中任务' : '暂无已完成任务'}
          </p>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}
