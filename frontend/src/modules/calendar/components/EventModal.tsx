import { useState } from 'react'
import { EventForm, type EventFormValues } from './EventForm'
import { useCreateEvent, useUpdateEvent, useDeleteEvent, useEvents, useToggleEventStatus } from '../hooks/useEvents'
import { useCategories } from '../hooks/useCategories'
import { useTags } from '../hooks/useTags'
import { useCalendarStore } from '../store/calendarStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/core/lib/utils'

interface EventModalProps {
  open: boolean
  eventId: number | null
  onClose: () => void
}

export function EventModal({ open, eventId, onClose }: EventModalProps) {
  const { currentDate, view } = useCalendarStore()
  const { data: events } = useEvents(currentDate, view)
  const { data: categories } = useCategories()
  const { data: tags } = useTags()
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()
  const toggleStatus = useToggleEventStatus()
  const [showDelete, setShowDelete] = useState(false)

  const existingEvent = eventId ? events?.find((e) => e.id === eventId) : undefined
  const isCompleted = existingEvent?.status === 'COMPLETED'

  const handleSubmit = (values: EventFormValues) => {
    if (eventId) {
      updateMutation.mutate(
        { id: eventId, data: values },
        { onSuccess: onClose }
      )
    } else {
      createMutation.mutate(values, { onSuccess: onClose })
    }
  }

  const handleDelete = () => {
    if (eventId) {
      deleteMutation.mutate(eventId, { onSuccess: onClose })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setShowDelete(false)
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {eventId ? '编辑日程' : '新建日程'}
            {isCompleted && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                已完成
              </span>
            )}
          </DialogTitle>
          {eventId && existingEvent && (
            <div className="flex items-center gap-1 mr-8">
              <button
                type="button"
                onClick={() => toggleStatus.mutate(existingEvent)}
                disabled={toggleStatus.isPending}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isCompleted
                    ? 'text-foreground-muted hover:text-foreground-secondary hover:bg-hover'
                    : 'text-emerald-600 hover:bg-emerald-50'
                )}
              >
                {isCompleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                {isCompleted ? '恢复计划' : '标记完成'}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(!showDelete)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  showDelete
                    ? 'bg-red-50 text-red-600'
                    : 'text-foreground-muted hover:text-red-500 hover:bg-red-50'
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="p-6">
          {showDelete && (
            <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 p-3 mb-4">
              <span className="text-sm text-red-700 font-medium">确认删除此日程？此操作不可撤销。</span>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDelete(false)}>
                  取消
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                  确认删除
                </Button>
              </div>
            </div>
          )}

          <EventForm
            initialValues={existingEvent}
            categories={categories ?? []}
            tags={tags ?? []}
            onSubmit={handleSubmit}
            loading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
