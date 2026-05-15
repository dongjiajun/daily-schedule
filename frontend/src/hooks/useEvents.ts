import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { listEvents, createEvent, updateEvent, deleteEvent } from '../api/sdk.gen'
import type { EventCreateRequest } from '../api/types.gen'

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

export function useEvents(date: dayjs.Dayjs, view: string, categoryId?: number | null) {
  const { start, end } = getViewRange(date, view)

  return useQuery({
    queryKey: ['events', start, end, categoryId],
    queryFn: async () => {
      const resp = await listEvents({
        query: { start, end, categoryId: categoryId ?? undefined },
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
    mutationFn: (data: EventCreateRequest) =>
      createEvent({ body: data }).then((r: any) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventCreateRequest }) =>
      updateEvent({ path: { id }, body: data }).then((r: any) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEvent({ path: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}
