import { CalendarView } from '../components/calendar/CalendarView'
import { EventModal } from '../components/event/EventModal'
import { useCalendarStore } from '../store/calendarStore'
import { useSseNotifications } from '../hooks/useSseNotifications'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export function HomePage() {
  const { modalOpen, closeModal, editingEventId } = useCalendarStore()
  useSseNotifications()
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
