import { useState } from 'react'
import type { TaskProfile } from '@/api/types.gen'
import { useDeleteTaskWithUndo, useMoveTaskWithPetEvent } from '../hooks/useTasks'
import { cn } from '@/core/lib/utils'
import { Badge } from '@/core/components/ui/badge'
import { Button } from '@/core/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select'
import { AlertTriangle, Calendar, Pencil, Trash2, ClipboardList, CircleDot, CheckCircle2 } from 'lucide-react'

const priorityTones: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  URGENT: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'neutral',
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
  const [isDragging, setIsDragging] = useState(false)
  const isOverdue =
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
  const isDone = task.status === 'DONE'

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', String(task.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        'bg-surface rounded-xl shadow-card border border-border-subtle p-[var(--density-card-pad)] cursor-grab active:cursor-grabbing hover:shadow-float hover:border-border hover:-translate-y-0.5 transition-all duration-fast group',
        isDragging && 'opacity-50 scale-[0.98]'
      )}
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className={cn(
            'text-sm font-medium flex-1 truncate',
            isDone ? 'line-through text-foreground-muted' : 'text-foreground'
          )}
        >
          {task.title}
        </span>
        <Badge tone={priorityTones[task.priority ?? 'MEDIUM'] ?? 'info'}>
          {priorityLabels[task.priority ?? 'MEDIUM'] ?? task.priority}
        </Badge>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs mb-1.5 tabular-nums',
            isOverdue ? 'text-error-fg font-semibold' : 'text-foreground-muted'
          )}
        >
          {isOverdue && <AlertTriangle className="size-3" />}
          <Calendar className="size-3" />
          {task.dueDate}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {task.tags.map((tag) => {
            const tagColor = tag.color ?? 'var(--color-info)'
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full border text-foreground-secondary"
                style={{
                  backgroundColor: `color-mix(in srgb, ${tagColor} 14%, transparent)`,
                  borderColor: `color-mix(in srgb, ${tagColor} 35%, transparent)`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: tagColor }}
                />
                {tag.name}
              </span>
            )
          })}
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
            className="text-error-fg hover:text-error"
          >
            <Trash2 className="size-3" />
            删除
          </Button>
        </div>
      </div>
    </div>
  )
}
