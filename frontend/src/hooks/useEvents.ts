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

  return useQuery({
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
      return resp.data ?? []
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: EventCreateRequest): Promise<EventResponse | undefined> => {
      const r = await createEvent({ body: data })
      return r.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      { id, data }: { id: number; data: EventCreateRequest }
    ): Promise<EventResponse | undefined> => {
      const r = await updateEvent({ path: { id }, body: data })
      return r.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEvent({ path: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('日程已删除')
    },
    onError: (err: Error) => {
      toast.error(`删除失败: ${err.message}`)
    },
  })
}
