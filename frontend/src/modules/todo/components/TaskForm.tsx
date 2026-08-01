import { useState } from 'react'
import type { TaskProfile, CreateTaskRequest, UpdateTaskRequest } from '@/api/types.gen'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { emitTaskCreated, emitTaskCompleted } from '../lib/taskEvents'
import { Button } from '@/core/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'

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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑任务' : '新建任务'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="输入任务标题"
              className="w-full px-3 py-2 border border-border rounded bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-focus"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-focus resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                优先级
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                className="w-full px-3 py-2 border border-border rounded bg-surface text-foreground"
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-surface text-foreground"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
