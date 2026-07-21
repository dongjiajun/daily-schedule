import { useState } from 'react'
import type { TaskProfile, CreateTaskRequest, UpdateTaskRequest } from '@/api/types.gen'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { emitTaskCreated, emitTaskCompleted } from '../lib/taskEvents'

interface TaskFormProps {
  task?: TaskProfile | null
  open: boolean
  onClose: () => void
}

export function TaskForm({ task, open, onClose }: TaskFormProps) {
  const isEdit = !!task
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>(
    (task?.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') ?? 'MEDIUM'
  )
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (isEdit && task?.id) {
      const data: UpdateTaskRequest = {
        title: title.trim(),
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
      }
      updateTask.mutate(
        { id: task.id, data },
        {
          onSuccess: (result) => {
            if (result?.status === 'DONE') {
              emitTaskCompleted(String(task.id!), title)
            }
            onClose()
          },
        }
      )
    } else {
      const data: CreateTaskRequest = {
        title: title.trim(),
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
      }
      createTask.mutate(data, {
        onSuccess: (result) => {
          emitTaskCreated(String(result!.id!))
          onClose()
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {isEdit ? '编辑任务' : '新建任务'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                优先级
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
