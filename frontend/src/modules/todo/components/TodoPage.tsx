import { useState } from 'react'
import type { TaskProfile } from '@/api/types.gen'
import { useTasks } from '../hooks/useTasks'
import { useTodoStore } from '../store/todoStore'
import { TaskToolbar } from './TaskToolbar'
import { BoardView } from './BoardView'
import { ListView } from './ListView'
import { TaskForm } from './TaskForm'
import { Skeleton } from '@/core/components/ui/skeleton'
import { EmptyState } from '@/core/components/ui/empty-state'

export default function TodoPage() {
  const { viewMode, setViewMode } = useTodoStore()
  const { data: tasks = [], isLoading, isError } = useTasks()
  const [editTask, setEditTask] = useState<TaskProfile | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) {
    return <EmptyState title="加载失败" description="请刷新页面重试" />
  }

  return (
    <div className="flex flex-col h-full">
      <TaskToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewTask={() => setShowNewForm(true)}
      />

      {viewMode === 'board' ? (
        <BoardView tasks={tasks} onEdit={setEditTask} />
      ) : (
        <ListView tasks={tasks} onEdit={setEditTask} />
      )}

      {/* Edit form — key ensures state resets when switching tasks */}
      <TaskForm key={editTask?.id ?? 'edit'} task={editTask} open={!!editTask} onClose={() => setEditTask(null)} />

      {/* New task form */}
      <TaskForm key="new" task={null} open={showNewForm} onClose={() => setShowNewForm(false)} />
    </div>
  )
}
