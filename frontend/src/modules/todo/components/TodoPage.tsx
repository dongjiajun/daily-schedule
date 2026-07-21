import { useState } from 'react'
import type { TaskProfile } from '@/api/types.gen'
import { useTasks } from '../hooks/useTasks'
import { useTodoStore } from '../store/todoStore'
import { TaskToolbar } from './TaskToolbar'
import { BoardView } from './BoardView'
import { ListView } from './ListView'
import { TaskForm } from './TaskForm'

export default function TodoPage() {
  const { viewMode, setViewMode } = useTodoStore()
  const { data: tasks = [], isLoading, isError } = useTasks()
  const [editTask, setEditTask] = useState<TaskProfile | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">加载失败，请刷新重试</p>
      </div>
    )
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
