import { useState } from 'react'
import type { TaskProfile, CreateTaskRequest, UpdateTaskRequest } from '@/api/types.gen'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { emitTaskCreated, emitTaskCompleted } from '../lib/taskEvents'
import { Button } from '@/core/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select'
import { Textarea } from '@/core/components/ui/textarea'

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
            <Label htmlFor="task-title" className="mb-1.5">
              标题 *
            </Label>
            <Input
              id="task-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="输入任务标题"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="task-desc" className="mb-1.5">
              描述
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="添加任务描述（可选）"
              className="resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="task-priority" className="mb-1.5">
                优先级
              </Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">低</SelectItem>
                  <SelectItem value="MEDIUM">中</SelectItem>
                  <SelectItem value="HIGH">高</SelectItem>
                  <SelectItem value="URGENT">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="task-due-date" className="mb-1.5">
                截止日期
              </Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
