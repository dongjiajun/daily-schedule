import type { ViewMode } from '../store/todoStore'
import { Button } from '@/core/components/ui/button'
import { Columns2, List, Plus } from 'lucide-react'

interface TaskToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onNewTask: () => void
}

export function TaskToolbar({ viewMode, onViewModeChange, onNewTask }: TaskToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
      {/* View toggle */}
      <div className="flex items-center gap-1 bg-hover rounded-lg p-0.5">
        <Button
          variant={viewMode === 'board' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('board')}
        >
          <Columns2 className="size-4" />
          看板
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
        >
          <List className="size-4" />
          列表
        </Button>
      </div>

      {/* New task button */}
      <Button onClick={onNewTask} size="sm">
        <Plus className="size-4" />
        新建任务
      </Button>
    </div>
  )
}
