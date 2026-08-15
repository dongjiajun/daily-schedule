import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listTasks, createTask, updateTask, deleteTask, moveTask } from '@/api/sdk.gen'
import { unwrap } from '@/core/lib/unwrap'
import { emitTaskCompleted } from '../lib/taskEvents'
import type { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest, TaskProfile } from '@/api/types.gen'

function tasksKey(status?: string, priority?: string, tagId?: number) {
  return ['tasks', { status, priority, tagId }] as const
}

export function useTasks(status?: string, priority?: string, tagId?: number) {
  return useQuery<TaskProfile[]>({
    queryKey: tasksKey(status, priority, tagId),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp = await listTasks({ query: { status: status as any, priority: priority as any, tagId } })
      return unwrap(resp) ?? []
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation<TaskProfile, Error, CreateTaskRequest>({
    mutationFn: async (data) => unwrap(await createTask({ body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('任务创建成功')
    },
    onError: (err) => { toast.error(err.message) },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation<TaskProfile, Error, { id: number; data: UpdateTaskRequest }>({
    mutationFn: async ({ id, data }) => unwrap(await updateTask({ path: { id }, body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('任务已更新')
    },
    onError: (err) => { toast.error(err.message) },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { unwrap(await deleteTask({ path: { id } })) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => { toast.error(err.message) },
  })
}

/**
 * 删除 + sonner 撤销：删除成功后弹 toast 并提供"撤销" action，
 * 撤销 = 重新创建任务（原字段 + 标签）→ 恢复原列（moveTask）。
 * 替代原生 window.confirm（触摸设备/主题一致性）。
 */
export function useDeleteTaskWithUndo() {
  const deleteTask = useDeleteTask()
  const createTask = useCreateTask()
  const moveTask = useMoveTask()

  const deleteWithUndo = (task: TaskProfile) => {
    deleteTask.mutate(task.id!, {
      onSuccess: () => {
        toast.success('任务已删除', {
          duration: 8000,
          action: {
            label: '撤销',
            onClick: async () => {
              try {
                const restored = await createTask.mutateAsync({
                  title: task.title ?? '',
                  description: task.description ?? undefined,
                  priority: (task.priority as CreateTaskRequest['priority']) ?? undefined,
                  dueDate: task.dueDate ?? undefined,
                  tagIds: task.tags?.map((t) => t.id!),
                })
                if (restored.id && task.status && task.status !== 'TODO') {
                  await moveTask.mutateAsync({
                    id: restored.id,
                    data: {
                      status: task.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
                      sortOrder: task.sortOrder ?? 0,
                    },
                  })
                }
                toast.success('已撤销删除')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : '撤销失败')
              }
            },
          },
        })
      },
    })
  }

  return { deleteWithUndo }
}

/** 移动任务到新状态，并在完成时触发宠物联动事件（列表/看板共用）。 */
export function useMoveTaskWithPetEvent() {
  const moveTask = useMoveTask()
  return (task: TaskProfile, newStatus: string) => {
    moveTask.mutate(
      {
        id: task.id!,
        data: {
          status: newStatus as 'TODO' | 'IN_PROGRESS' | 'DONE',
          sortOrder: task.sortOrder ?? 0,
        },
      },
      {
        onSuccess: () => {
          if (newStatus === 'DONE' && task.title) {
            emitTaskCompleted(String(task.id!), task.title)
          }
        },
      }
    )
  }
}

export function useMoveTask() {
  const queryClient = useQueryClient()
  return useMutation<TaskProfile, Error, { id: number; data: MoveTaskRequest }>({
    mutationFn: async ({ id, data }) => unwrap(await moveTask({ path: { id }, body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => { toast.error(err.message) },
  })
}
