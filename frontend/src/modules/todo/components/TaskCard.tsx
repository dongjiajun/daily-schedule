import type { TaskProfile } from '@/api/types.gen'
import { useDeleteTaskWithUndo, useMoveTaskWithPetEvent } from '../hooks/useTasks'
import { Button } from '@/core/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select'
import { AlertTriangle, Calendar, Pencil, Trash2, ClipboardList, CircleDot, CheckCircle2 } from 'lucide-react'

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
  const { deleteWithUndo } = useDeleteTaskWithUndo()
  const moveWithPetEvent = useMoveTaskWithPetEvent()
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

      {/* Status switch + action buttons（常驻可见，触摸设备无 hover 也可操作） */}
      <div className="flex items-center justify-between gap-1 mt-2">
        <Select
          value={task.status ?? 'TODO'}
          onValueChange={(newStatus) => moveWithPetEvent(task, newStatus)}
        >
          <SelectTrigger className="h-7 w-[110px] text-xs" aria-label="状态">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODO">
              <span className="flex items-center gap-1.5">
                <ClipboardList className="size-3.5" />
                待办
              </span>
            </SelectItem>
            <SelectItem value="IN_PROGRESS">
              <span className="flex items-center gap-1.5">
                <CircleDot className="size-3.5" />
                进行中
              </span>
            </SelectItem>
            <SelectItem value="DONE">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                已完成
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-1">
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
            onClick={() => deleteWithUndo(task)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="size-3" />
            删除
          </Button>
        </div>
      </div>
    </div>
  )
}
