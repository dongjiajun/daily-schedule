import { CalendarView } from './CalendarView'
import { EventModal } from './EventModal'
import { useCalendarStore } from '../store/calendarStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export function HomePage() {
  const { modalOpen, closeModal, editingEventId } = useCalendarStore()
  useKeyboardShortcuts()

  return (
    <div className="h-full flex flex-col">
      <CalendarView />
      <EventModal
        open={modalOpen}
        eventId={editingEventId}
        onClose={closeModal}
      />
    </div>
  )
}
