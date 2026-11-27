import type { TaskProfile } from '@/api/types.gen'
import { useDeleteTaskWithUndo, useMoveTaskWithPetEvent } from '../hooks/useTasks'
import { cn } from '@/core/lib/utils'
import { Badge } from '@/core/components/ui/badge'
import { Button } from '@/core/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select'
import { AlertTriangle, Pencil, Trash2, ClipboardList, CircleDot, CheckCircle2 } from 'lucide-react'

const priorityLabels: Record<string, string> = {
  URGENT: '紧急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

const priorityTones: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  URGENT: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'neutral',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  TODO: ClipboardList,
  IN_PROGRESS: CircleDot,
  DONE: CheckCircle2,
}

const statusIconColors: Record<string, string> = {
  TODO: 'text-info-fg',
  IN_PROGRESS: 'text-warning-fg',
  DONE: 'text-success-fg',
}

interface TaskRowProps {
  task: TaskProfile
  onEdit: (task: TaskProfile) => void
}

export function TaskRow({ task, onEdit }: TaskRowProps) {
  const { deleteWithUndo } = useDeleteTaskWithUndo()
  const moveWithPetEvent = useMoveTaskWithPetEvent()
  const isDone = task.status === 'DONE'
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date()

  const StatusIcon = statusIcon[task.status ?? 'TODO'] ?? ClipboardList
  const iconColor = statusIconColors[task.status ?? 'TODO'] ?? 'text-foreground-muted'

  return (
    <div className="flex items-center gap-3 px-5 py-[var(--density-row-py)] bg-surface border-b border-border-subtle hover:bg-hover/60 transition-colors duration-fast">
      {/* Status dropdown */}
      <Select
        value={task.status ?? 'TODO'}
        onValueChange={(newStatus) => moveWithPetEvent(task, newStatus)}
      >
        <SelectTrigger className="w-[120px] h-8 text-sm">
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

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-sm truncate flex items-center gap-2',
          isDone ? 'line-through text-foreground-muted' : 'text-foreground'
        )}
      >
        <StatusIcon className={cn('size-3.5 flex-shrink-0', iconColor)} />
        {task.title}
      </span>

      {/* Priority */}
      <div className="min-w-[48px] flex items-center">
        <Badge tone={priorityTones[task.priority ?? 'MEDIUM'] ?? 'info'}>
          {priorityLabels[task.priority ?? 'MEDIUM']}
        </Badge>
      </div>

      {/* Due date */}
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs min-w-[96px] tabular-nums',
          isOverdue ? 'text-error-fg font-semibold' : 'text-foreground-muted'
        )}
      >
        {isOverdue && <AlertTriangle className="size-3.5 shrink-0" />}
        {task.dueDate ? task.dueDate : '—'}
      </span>

      {/* Tags */}
      <div className="flex gap-1 min-w-[80px]">
        {task.tags?.map((tag) => {
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

      {/* Actions */}
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
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
  )
}
