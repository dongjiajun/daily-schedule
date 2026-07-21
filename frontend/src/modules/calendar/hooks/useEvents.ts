import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { listEvents, createEvent, updateEvent, deleteEvent } from '@/api/sdk.gen'
import { unwrap } from '@/core/lib/unwrap'
import { eventBus } from '@/core/lib/eventBus'
import type { EventCreateRequest, EventResponse } from '@/api/types.gen'

function getViewRange(date: dayjs.Dayjs, view: string) {
  switch (view) {
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
    case 'month':
    default:
      return {
        start: date.startOf('month').subtract(7, 'day').toISOString(),
        end: date.endOf('month').add(7, 'day').toISOString(),
      }
  }
}

export interface EventQueryFilter {
  categoryId?: number | null
  tagId?: number | null
  keyword?: string
}

export function useEvents(date: dayjs.Dayjs, view: string, filter: EventQueryFilter = {}) {
  const { start, end } = getViewRange(date, view)
  const { categoryId, tagId, keyword } = filter

  return useQuery<EventResponse[]>({
    queryKey: ['events', start, end, categoryId ?? null, tagId ?? null, keyword || ''],
    queryFn: async () => {
      const resp = await listEvents({
        query: {
          start,
          end,
          categoryId: categoryId ?? undefined,
          tagId: tagId ?? undefined,
          keyword: keyword || undefined,
          size: 500,
        },
      })
      return unwrap(resp) ?? []
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation<EventResponse, Error, EventCreateRequest>({
    mutationFn: async (data) => unwrap(await createEvent({ body: data })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('日程创建成功')
      eventBus.emit({ type: 'event:created', payload: { eventId: String(data.id), title: data.title ?? '' } })
    },
    onError: (err) => { toast.error(err.message) },
  })
}

export function useUpdateEvent(options?: { silent?: boolean }) {
  const queryClient = useQueryClient()
  return useMutation<EventResponse, Error, { id: number; data: EventCreateRequest }>({
    mutationFn: async ({ id, data }) => unwrap(await updateEvent({ path: { id }, body: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      if (!options?.silent) toast.success('日程已更新')
    },
    onError: (err) => { toast.error(err.message) },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: number; title: string }>({
    mutationFn: async ({ id }) => { unwrap(await deleteEvent({ path: { id } })) },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('日程已删除')
      eventBus.emit({ type: 'event:cancelled', payload: { eventId: String(variables.id), title: variables.title } })
    },
    onError: (err) => { toast.error(err.message) },
  })
}

/**
 * 快速切换日程完成状态：把现有事件全量字段 + 新状态 PUT 回去
 * （契约要求 update 携带 title/startTime/endTime）。
 */
export function useToggleEventStatus() {
  const queryClient = useQueryClient()
  return useMutation<EventResponse, Error, EventResponse>({
    mutationFn: async (event) => {
      const nextStatus = event.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED'
      const body: EventCreateRequest = {
        title: event.title!,
        description: event.description,
        startTime: event.startTime!,
        endTime: event.endTime!,
        allDay: event.allDay,
        location: event.location,
        color: event.color,
        reminderMinutes: event.reminderMinutes,
        status: nextStatus,
        categoryId: event.categoryId,
        tagIds: event.tags?.map((t: { id?: number }) => t.id!).filter(Boolean),
      }
      return unwrap(await updateEvent({ path: { id: event.id! }, body }))
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(updated.status === 'COMPLETED' ? '已标记完成' : '已恢复为计划中')
      if (updated.status === 'COMPLETED') {
        eventBus.emit({ type: 'event:completed', payload: { eventId: String(updated.id), title: updated.title ?? '' } })
      }
    },
    onError: (err) => { toast.error(err.message) },
  })
}
