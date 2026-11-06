import type { ViewMode } from '../store/todoStore'
import { Button } from '@/core/components/ui/button'
import { Segmented } from '@/core/components/ui/segmented'
import { Columns2, List, Plus } from 'lucide-react'

interface TaskToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onNewTask: () => void
}

const VIEW_OPTIONS = [
  { value: 'board' as const, label: <><Columns2 className="size-4" />看板</> },
  { value: 'list' as const, label: <><List className="size-4" />列表</> },
]

export function TaskToolbar({ viewMode, onViewModeChange, onNewTask }: TaskToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
      <Segmented
        ariaLabel="任务视图"
        value={viewMode}
        onChange={onViewModeChange}
        options={VIEW_OPTIONS}
        size="sm"
      />

      {/* New task button */}
      <Button onClick={onNewTask} size="sm">
        <Plus className="size-4" />
        新建任务
      </Button>
    </div>
  )
}
