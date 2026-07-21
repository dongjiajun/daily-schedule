import type { ViewMode } from '../store/todoStore'

interface TaskToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onNewTask: () => void
}

export function TaskToolbar({ viewMode, onViewModeChange, onNewTask }: TaskToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* View toggle */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
        <button
          onClick={() => onViewModeChange('board')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            viewMode === 'board'
              ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 看板
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            viewMode === 'list'
              ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📄 列表
        </button>
      </div>

      {/* New task button */}
      <button
        onClick={onNewTask}
        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        + 新建任务
      </button>
    </div>
  )
}
