import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listTasks, createTask, updateTask, deleteTask, moveTask } from '@/api/sdk.gen'
import { unwrap } from '@/core/lib/unwrap'
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
      toast.success('任务已删除')
    },
    onError: (err) => { toast.error(err.message) },
  })
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
