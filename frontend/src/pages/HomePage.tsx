import { CalendarView } from '../components/calendar/CalendarView'
import { EventModal } from '../components/event/EventModal'
import { useCalendarStore } from '../store/calendarStore'

export function HomePage() {
  const { modalOpen, closeModal, editingEventId } = useCalendarStore()

  return (
    <div className="h-full flex flex-col">
      <CalendarView />
      {modalOpen && (
        <EventModal
          eventId={editingEventId}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
