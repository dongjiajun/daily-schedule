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
        </DialogHeader>

        <div className="p-6">
          <EventForm
            initialValues={existingEvent}
            categories={categories ?? []}
            tags={tags ?? []}
            onSubmit={handleSubmit}
            loading={isLoading}
          />

          {eventId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {showDelete ? (
                <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <span className="text-sm text-red-700">确认删除此日程？</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDelete(false)}
                      className="text-red-600 hover:bg-red-100"
                    >
                      取消
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                  className="text-red-500 hover:bg-red-50"
                >
                  删除此日程
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
