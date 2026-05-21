import { useState } from 'react'
import { EventForm, type EventFormValues } from './EventForm'
import { useCreateEvent, useUpdateEvent, useDeleteEvent, useEvents } from '../../hooks/useEvents'
import { useCategories } from '../../hooks/useCategories'
import { useTags } from '../../hooks/useTags'
import { useCalendarStore } from '../../store/calendarStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [showDelete, setShowDelete] = useState(false)

  const existingEvent = eventId ? events?.find((e) => e.id === eventId) : undefined

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
          <DialogTitle>{eventId ? '编辑日程' : '新建日程'}</DialogTitle>
          {eventId && (
            <button
              type="button"
              onClick={() => setShowDelete(!showDelete)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all mr-8',
                showDelete
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
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
