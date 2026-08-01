import type { TaskProfile } from '@/api/types.gen'
import { useDeleteTask } from '../hooks/useTasks'
import { Button } from '@/core/components/ui/button'
import { AlertTriangle, Calendar, Pencil, Trash2 } from 'lucide-react'

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500 text-white',
  HIGH: 'bg-orange-400 text-white',
  MEDIUM: 'bg-blue-400 text-white',
  LOW: 'bg-gray-300 text-gray-700',
}

const priorityLabels: Record<string, string> = {
  URGENT: '紧急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

interface TaskCardProps {
  task: TaskProfile
  onEdit: (task: TaskProfile) => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const deleteTask = useDeleteTask()
  const isOverdue =
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(task.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-surface rounded-xl shadow-sm border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {task.title}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority ?? 'MEDIUM'] ?? priorityColors.MEDIUM}`}
        >
          {priorityLabels[task.priority ?? 'MEDIUM'] ?? task.priority}
        </span>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className={`flex items-center gap-1 text-xs mb-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-foreground-muted'}`}>
          {isOverdue && <AlertTriangle className="size-3" />}
          <Calendar className="size-3" />
          {task.dueDate}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color ?? '#888' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
        >
          <Pencil className="size-3" />
          编辑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm('确定删除此任务？')) {
              deleteTask.mutate(task.id!)
            }
          }}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="size-3" />
          删除
        </Button>
      </div>
    </div>
  )
}
