import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { listEvents, createEvent, updateEvent, deleteEvent } from '../api/sdk.gen'
import type { EventCreateRequest, EventResponse } from '../api/types.gen'

function getViewRange(date: dayjs.Dayjs, view: string) {
  switch (view) {
    case 'month':
      return {
        start: date.startOf('month').subtract(7, 'day').toISOString(),
        end: date.endOf('month').add(7, 'day').toISOString(),
      }
    case 'week':
      return {
        start: date.startOf('week').toISOString(),
        end: date.endOf('week').toISOString(),
      }
    case 'day':
      return {
        start: date.startOf('day').toISOString(),
        end: date.endOf('day').toISOString(),
      }
    default:
      return {
        start: date.startOf('month').subtract(7, 'day').toISOString(),
        end: date.endOf('month').add(7, 'day').toISOString(),
      }
  }
}

export function useEvents(date: dayjs.Dayjs, view: string, categoryId?: number | null, keyword?: string) {
  const { start, end } = getViewRange(date, view)

  return useQuery<EventResponse[]>({
    queryKey: ['events', start, end, categoryId, keyword],
    queryFn: async () => {
      const resp = await listEvents({
        query: {
          start,
          end,
          categoryId: categoryId ?? undefined,
          keyword: keyword || undefined,
        },
      })
      return (resp.data ?? []) as EventResponse[]
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation<EventResponse | undefined, Error, EventCreateRequest>({
    mutationFn: async (data) => {
      const r = await createEvent({ body: data })
      return r.data as EventResponse | undefined
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('日程创建成功')
    },
    onError: (err) => { toast.error(`创建失败: ${err.message}`) },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation<EventResponse | undefined, Error, { id: number; data: EventCreateRequest }>({
    mutationFn: async ({ id, data }) => {
      const r = await updateEvent({ path: { id }, body: data })
      return r.data as EventResponse | undefined
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('日程已更新')
    },
    onError: (err) => { toast.error(`更新失败: ${err.message}`) },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { await deleteEvent({ path: { id } }) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('日程已删除')
    },
    onError: (err) => { toast.error(`删除失败: ${err.message}`) },
  })
}
