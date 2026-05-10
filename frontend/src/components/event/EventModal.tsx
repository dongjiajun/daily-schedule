import { useState } from 'react'
import { X } from 'lucide-react'
import { EventForm, type EventFormValues } from './EventForm'
import { useCreateEvent, useUpdateEvent, useDeleteEvent, useEvents } from '../../hooks/useEvents'
import { useCategories } from '../../hooks/useCategories'
import { useTags } from '../../hooks/useTags'
import { useCalendarStore } from '../../store/calendarStore'

interface EventModalProps {
  eventId: number | null
  onClose: () => void
}

export function EventModal({ eventId, onClose }: EventModalProps) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {eventId ? '编辑日程' : '新建日程'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                    <button
                      onClick={() => setShowDelete(false)}
                      className="px-3 py-1 text-sm rounded-lg hover:bg-red-100 text-red-600"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDelete(true)}
                  className="px-3 py-1.5 text-sm rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  删除此日程
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
