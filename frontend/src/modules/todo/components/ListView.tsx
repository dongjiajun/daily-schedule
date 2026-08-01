import { useState, useMemo } from 'react'
import type { TaskProfile } from '@/api/types.gen'
import { TaskRow } from './TaskRow'
import { Button } from '@/core/components/ui/button'

type SortMode = 'default' | 'priority' | 'dueDate' | 'createdAt'

interface ListViewProps {
  tasks: TaskProfile[]
  onEdit: (task: TaskProfile) => void
}

const sortLabels: Record<SortMode, string> = {
  default: '默认',
  priority: '优先级',
  dueDate: '截止日期',
  createdAt: '创建时间',
}

const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export function ListView({ tasks, onEdit }: ListViewProps) {
  const [sortMode, setSortMode] = useState<SortMode>('default')

  const sorted = useMemo(() => {
    const list = [...tasks]
    switch (sortMode) {
      case 'priority':
        list.sort((a, b) => (priorityOrder[a.priority ?? 'MEDIUM'] ?? 99) - (priorityOrder[b.priority ?? 'MEDIUM'] ?? 99))
        break
      case 'dueDate':
        list.sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
        break
      case 'createdAt':
        list.sort((a, b) => {
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        break
      default:
        list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }
    return list
  }, [tasks, sortMode])

  return (
    <div className="flex flex-col h-full">
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border-b border-border">
        <span className="text-xs text-foreground-muted">排序：</span>
        {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
          <Button
            key={mode}
            variant="ghost"
            size="sm"
            onClick={() => setSortMode(mode)}
            className={sortMode === mode ? 'bg-accent text-accent-fg hover:bg-accent-hover' : ''}
          >
            {sortLabels[mode]}
          </Button>
        ))}
        <span className="text-xs text-foreground-muted ml-auto">{sorted.length} 个任务</span>
      </div>

      {/* Task rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">暂无任务，点击"+ 新建任务"开始</p>
        ) : (
          sorted.map((task) => <TaskRow key={task.id} task={task} onEdit={onEdit} />)
        )}
      </div>
    </div>
  )
}
