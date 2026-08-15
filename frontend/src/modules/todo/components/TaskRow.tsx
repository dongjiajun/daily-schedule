import type { TaskProfile } from '@/api/types.gen'
import { useDeleteTaskWithUndo, useMoveTaskWithPetEvent } from '../hooks/useTasks'
import { Button } from '@/core/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select'
import { Pencil, Trash2, ClipboardList, CircleDot, CheckCircle2 } from 'lucide-react'

const priorityLabels: Record<string, string> = {
  URGENT: '紧急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

const priorityTextColors: Record<string, string> = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-blue-400',
  LOW: 'text-foreground-muted',
}

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  TODO: ClipboardList,
  IN_PROGRESS: CircleDot,
  DONE: CheckCircle2,
}

interface TaskRowProps {
  task: TaskProfile
  onEdit: (task: TaskProfile) => void
}

export function TaskRow({ task, onEdit }: TaskRowProps) {
  const { deleteWithUndo } = useDeleteTaskWithUndo()
  const moveWithPetEvent = useMoveTaskWithPetEvent()
  const isOverdue =
    task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()

  const StatusIcon = statusIcon[task.status ?? 'TODO'] ?? ClipboardList

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface border-b border-border hover:bg-hover transition-colors">
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
      <span className="flex-1 text-sm text-foreground truncate flex items-center gap-1.5">
        <StatusIcon className="size-3.5 flex-shrink-0" />
        {task.title}
      </span>

      {/* Priority */}
      <span className={`text-xs min-w-[40px] ${priorityTextColors[task.priority ?? 'MEDIUM']}`}>
        {priorityLabels[task.priority ?? 'MEDIUM']}
      </span>

      {/* Due date */}
      <span className={`text-xs min-w-[90px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-foreground-muted'}`}>
        {task.dueDate ? task.dueDate : '—'}
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
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
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
  )
}
