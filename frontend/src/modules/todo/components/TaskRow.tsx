import type { TaskProfile } from '@/api/types.gen'
import { useDeleteTask, useMoveTask } from '../hooks/useTasks'
import { emitTaskCompleted } from '../lib/taskEvents'

const priorityLabels: Record<string, string> = {
  URGENT: '🔴 紧急',
  HIGH: '🟠 高',
  MEDIUM: '🔵 中',
  LOW: '⚪ 低',
}

interface TaskRowProps {
  task: TaskProfile
  onEdit: (task: TaskProfile) => void
}

export function TaskRow({ task, onEdit }: TaskRowProps) {
  const deleteTask = useDeleteTask()
  const moveTask = useMoveTask()
  const isOverdue =
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()

  const handleStatusChange = (newStatus: string) => {
    moveTask.mutate(
      {
        id: task.id!,
        data: { status: newStatus as 'TODO' | 'IN_PROGRESS' | 'DONE', sortOrder: task.sortOrder ?? 0 },
      },
      {
        onSuccess: () => {
          if (newStatus === 'DONE' && task.title) {
            emitTaskCompleted(String(task.id!), task.title)
          }
        },
      }
    )
  }

  const statusIcon: Record<string, string> = {
    TODO: '📋',
    IN_PROGRESS: '🚀',
    DONE: '✅',
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
      {/* Status dropdown */}
      <select
        value={task.status ?? 'TODO'}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
      >
        <option value="TODO">📋 待办</option>
        <option value="IN_PROGRESS">🚀 进行中</option>
        <option value="DONE">✅ 已完成</option>
      </select>

      {/* Title */}
      <span className="flex-1 text-sm text-gray-800 dark:text-gray-100 truncate">
        {statusIcon[task.status ?? 'TODO']} {task.title}
      </span>

      {/* Priority */}
      <span className="text-xs text-gray-500 min-w-[60px]">
        {priorityLabels[task.priority ?? 'MEDIUM']}
      </span>

      {/* Due date */}
      <span className={`text-xs min-w-[90px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
        {task.dueDate ? `${isOverdue ? '⚠️ ' : ''}${task.dueDate}` : '—'}
      </span>

      {/* Tags */}
      <div className="flex gap-1 min-w-[80px]">
        {task.tags?.map((tag) => (
          <span
            key={tag.id}
            className="text-xs px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: tag.color ?? '#888' }}
          >
            {tag.name}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onEdit(task)} className="text-xs text-blue-500 hover:text-blue-700">
          编辑
        </button>
        <button
          onClick={() => {
            if (window.confirm('确定删除此任务？')) deleteTask.mutate(task.id!)
          }}
          className="text-xs text-red-500 hover:text-red-700"
        >
          删除
        </button>
      </div>
    </div>
  )
}
