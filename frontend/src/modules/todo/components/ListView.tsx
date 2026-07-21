import { useState, useMemo } from 'react'
import type { TaskProfile } from '@/api/types.gen'
import { TaskRow } from './TaskRow'

type SortMode = 'default' | 'priority' | 'dueDate' | 'createdAt'

interface ListViewProps {
  tasks: TaskProfile[]
  onEdit: (task: TaskProfile) => void
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
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500">排序：</span>
        {(['default', 'priority', 'dueDate', 'createdAt'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`text-xs px-2 py-1 rounded ${
              sortMode === mode
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            {mode === 'default' ? '默认' : mode === 'priority' ? '优先级' : mode === 'dueDate' ? '截止日期' : '创建时间'}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{sorted.length} 个任务</span>
      </div>

      {/* Task rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">暂无任务，点击"+ 新建任务"开始</p>
        ) : (
          sorted.map((task) => <TaskRow key={task.id} task={task} onEdit={onEdit} />)
        )}
      </div>
    </div>
  )
}
