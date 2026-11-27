import type { TaskProfile } from '@/api/types.gen'
import { useCreateTask } from '../hooks/useTasks'
import { emitTaskCreated } from '../lib/taskEvents'
import { TaskCard } from './TaskCard'
import { cn } from '@/core/lib/utils'
import { useState } from 'react'
import { ClipboardList, CircleDot, CheckCircle2, Plus } from 'lucide-react'
import { Badge } from '@/core/components/ui/badge'
import { EmptyState } from '@/core/components/ui/empty-state'
import { Input } from '@/core/components/ui/input'

const columnConfig: Record<
  string,
  { title: string; Icon: React.ComponentType<{ className?: string }>; color: string; iconColor: string }
> = {
  TODO: { title: '待办', Icon: ClipboardList, color: 'border-info/40', iconColor: 'text-info-fg' },
  IN_PROGRESS: { title: '进行中', Icon: CircleDot, color: 'border-warning/40', iconColor: 'text-warning-fg' },
  DONE: { title: '已完成', Icon: CheckCircle2, color: 'border-success/40', iconColor: 'text-success-fg' },
}

interface TaskColumnProps {
  status: string
  tasks: TaskProfile[]
  onEdit: (task: TaskProfile) => void
}

export function TaskColumn({ status, tasks, onEdit }: TaskColumnProps) {
  const config = columnConfig[status] ?? columnConfig.TODO
  const { Icon } = config
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
      const event = new CustomEvent('task-drop', {
        detail: { taskId: Number(taskId), newStatus: status },
      })
      window.dispatchEvent(event)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col flex-1 min-w-[280px] basis-0 bg-surface-elevated rounded-xl border border-border-subtle transition-colors duration-fast',
        isDragOver && `border-2 border-dashed bg-hover/50 ${config.color}`
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-subtle">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
          <Icon className={cn('size-4', config.iconColor)} />
          {config.title}
          <Badge tone="neutral" className="ml-2 tabular-nums">{tasks.length}</Badge>
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-foreground-muted hover:text-foreground-secondary flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-hover transition-colors duration-fast"
        >
          <Plus className="size-3" />
          新建
        </button>
      </div>

      {/* Quick add input */}
      {isAdding && (
        <div className="px-3 py-2">
          <Input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            placeholder="输入任务标题，回车创建…"
            className="h-8 text-sm bg-surface"
            autoFocus
          />
        </div>
      )}

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
        {tasks.length === 0 && !isAdding && (
          <EmptyState
            className="py-6"
            title={status === 'TODO' ? '暂无待办任务' : status === 'IN_PROGRESS' ? '暂无进行中任务' : '暂无已完成任务'}
          />
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}
