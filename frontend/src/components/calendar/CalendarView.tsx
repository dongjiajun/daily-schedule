import { useMemo, useCallback } from 'react'
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import { useCalendarStore, type CalendarView } from '../../store/calendarStore'
import { useEvents } from '../../hooks/useEvents'
import type { EventResponse } from '../../api/types.gen'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

const localizer = dayjsLocalizer(dayjs)

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource: EventResponse
}

export function CalendarView() {
  const { currentDate, view, setCurrentDate, setView, filterCategoryId, openCreateModal, openEditModal } =
    useCalendarStore()
  const { data: events, isLoading } = useEvents(currentDate, view, filterCategoryId)

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      (events ?? []).map((e: EventResponse) => ({
        id: e.id!,
        title: e.title ?? '',
        start: new Date(e.startTime!),
        end: new Date(e.endTime!),
        allDay: e.allDay ?? false,
        resource: e,
      })),
    [events]
  )

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      openEditModal(event.id)
    },
    [openEditModal]
  )

  const handleSelectSlot = useCallback(
    () => {
      openCreateModal()
    },
    [openCreateModal]
  )

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const color = event.resource.color ?? '#1890ff'
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        border: 'none',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 500,
        padding: '2px 6px',
      },
    }
  }, [])

  const dayPropGetter = useCallback(
    (date: Date) => {
      const d = dayjs(date)
      if (d.isSame(dayjs(), 'day')) {
        return {
          style: { backgroundColor: '#f0f7ff' },
        }
      }
      return {}
    },
    []
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-full calendar-container">
      <Calendar<CalendarEvent>
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        views={{ month: true, week: true, day: true, agenda: true }}
        view={view as any}
        date={currentDate.toDate()}
        onView={(v) => setView(v as CalendarView)}
        onNavigate={(d) => setCurrentDate(dayjs(d))}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        popup
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        messages={{
          today: '今天',
          previous: '‹',
          next: '›',
          month: '月',
          week: '周',
          day: '日',
          agenda: '议程',
          date: '日期',
          time: '时间',
          event: '日程',
          noEventsInRange: '该时段没有日程',
          showMore: (total: number) => `+${total} 更多`,
        }}
        components={{
          toolbar: CalendarToolbar,
        }}
      />
    </div>
  )
}

function CalendarToolbar({ date, view, onView, onNavigate }: any) {
  const label = useMemo(() => {
    const d = dayjs(date)
    switch (view) {
      case 'month':
        return d.format('YYYY年 M月')
      case 'week':
        return `${d.startOf('week').format('M月D日')} - ${d.endOf('week').format('M月D日')}`
      case 'day':
        return d.format('YYYY年 M月D日 dddd')
      default:
        return d.format('YYYY年 M月')
    }
  }, [date, view])

  const btnClass = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors'
  const activeClass = 'bg-gray-900 text-white'
  const inactiveClass = 'text-gray-500 hover:bg-gray-100'

  const viewKeys = ['month', 'week', 'day', 'agenda'] as const
  const labels: Record<string, string> = { month: '月', week: '周', day: '日', agenda: '议程' }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-1">
        {viewKeys.map((v) => (
          <button
            key={v}
            className={`${btnClass} ${view === v ? activeClass : inactiveClass}`}
            onClick={() => onView(v)}
          >
            {labels[v]}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900">{label}</h2>

      <div className="flex items-center gap-1">
        <button className={`${btnClass} ${inactiveClass}`} onClick={() => onNavigate('PREV')}>
          ‹
        </button>
        <button className={`${btnClass} ${inactiveClass}`} onClick={() => onNavigate('TODAY')}>
          今天
        </button>
        <button className={`${btnClass} ${inactiveClass}`} onClick={() => onNavigate('NEXT')}>
          ›
        </button>
      </div>
    </div>
  )
}
