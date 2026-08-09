import { useEffect, useMemo, useCallback } from 'react'
import { Calendar, dayjsLocalizer, type ToolbarProps, type View } from 'react-big-calendar'
import _withDragAndDrop, { type withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import { registerZone, removeZone, getZones } from '@/modules/pet/lib/zoneRegistry'

// Vite CJS 预打包将 exports.default 包装为 ESM default，导致拿到的是
/* { default: fn, __esModule: true } 而非函数本身，此处手动解包 */
const withDragAndDrop = (
  typeof _withDragAndDrop === 'function' ? _withDragAndDrop : (_withDragAndDrop as any).default // eslint-disable-line @typescript-eslint/no-explicit-any
) as typeof _withDragAndDrop
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Check, RotateCcw } from 'lucide-react'
import { useCalendarStore, type CalendarView } from '../store/calendarStore'
import { useSettingsStore } from '@/core/store/settingsStore'
import { useEvents, useUpdateEvent, useToggleEventStatus } from '../hooks/useEvents'
import { cn } from '@/core/lib/utils'
import type { EventResponse } from '@/api/types.gen'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import './calendar.css'

dayjs.locale('zh-cn') // 周一作为一周起始，中文星期/月份
const localizer = dayjsLocalizer(dayjs)

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource: EventResponse
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar<CalendarEvent>)

const TIME_FMT = 'YYYY-MM-DDTHH:mm:ss'

function toUpdateBody(resource: EventResponse, start: Date, end: Date, allDay: boolean) {
  return {
    title: resource.title!,
    description: resource.description,
    startTime: dayjs(start).format(TIME_FMT),
    endTime: dayjs(end).format(TIME_FMT),
    allDay,
    location: resource.location,
    color: resource.color,
    reminderMinutes: resource.reminderMinutes,
    status: resource.status,
    categoryId: resource.categoryId,
    tagIds: resource.tags?.map((t) => t.id!).filter(Boolean),
  }
}

export function CalendarView() {
  const {
    currentDate, view, setCurrentDate, setView,
    filterCategoryId, filterTagId, searchKeyword,
    openCreateModal, openEditModal,
  } = useCalendarStore()
  const showCompleted = useSettingsStore((s) => s.showCompleted)
  const { data: events, isLoading } = useEvents(currentDate, view, {
    categoryId: filterCategoryId,
    tagId: filterTagId,
    keyword: searchKeyword,
  })
  const updateMutation = useUpdateEvent({ silent: true })
  const toggleStatus = useToggleEventStatus()

  // ── 月视图格子注册为 calendar-cell Zones（区域感知：宠物格内互动） ──
  // spec: pet-zone-interaction "Calendar month view registers calendar-cell zones"
  // 注册时机：月视图可见时；视图切换/卸载注销；scroll/resize（rAF 节流）事件驱动 rect 更新；
  // events 变化（标记完成/增删）→ effect 重跑 → 同 id 覆盖刷新完成度
  useEffect(() => {
    if (view !== 'month') return

    // react-big-calendar 月视图：.rbc-month-view > .rbc-month-row ×6 > .rbc-row-bg > .rbc-day-bg ×7
    // 格子无 data-date 属性，日期按"可见月起始 + 索引"映射（dayjs zh-cn 周一为周起始，与 localizer 一致）
    const CELL_SELECTOR = '.rbc-month-view .rbc-day-bg'
    let rafId = 0

    const refresh = () => {
      const cells = Array.from(document.querySelectorAll<HTMLElement>(CELL_SELECTOR))
      if (cells.length === 0) return

      // 完成度口径：当天 COMPLETED 数量占比（与 CalendarSidebar 同款逻辑，按天分组）
      const byDate = new Map<string, EventResponse[]>()
      for (const e of events ?? []) {
        const d = dayjs(e.startTime!).format('YYYY-MM-DD')
        if (!byDate.has(d)) byDate.set(d, [])
        byDate.get(d)!.push(e)
      }
      const completionOf = (date: string): number | null => {
        const list = byDate.get(date) ?? []
        // 无日程 = 无压力（快风格）；有日程但未完成 = 0（慢风格）——语义区分
        if (list.length === 0) return null
        return Math.round((list.filter((e) => e.status === 'COMPLETED').length / list.length) * 100)
      }

      // 可见月视图起始日：当前月第一天所在的周（周一）
      // 显式 locale('zh-cn')：store 的 dayjs 实例创建时可能早于全局 locale 设置（weekStart 仍为周日）
      const monthStart = dayjs(currentDate).locale('zh-cn').startOf('month').startOf('week')
      cells.forEach((cell, i) => {
        const date = monthStart.add(i, 'day').format('YYYY-MM-DD')
        const rect = cell.getBoundingClientRect()
        registerZone({
          id: `calendar-cell-${date}`,
          type: 'calendar-cell',
          rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
          payload: { date, completion: completionOf(date) },
          weight: 1,
        })
      })
    }

    // react-big-calendar 月视图渲染是异步的，等一帧 DOM 就绪再注册
    const readyTimer = setTimeout(refresh, 0)
    // 事件驱动 rect 更新（rAF 节流合并高频滚动，避免 layout thrash）
    const onScrollResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(refresh)
    }
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)

    return () => {
      clearTimeout(readyTimer)
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
      // 注销全部 calendar-cell Zones（视图切换/卸载）
      for (const z of getZones()) {
        if (z.type === 'calendar-cell') removeZone(z.id)
      }
    }
  }, [view, events, currentDate])

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      (events ?? [])
        .filter((e) => showCompleted || e.status === 'PLANNED' || !e.status)
        .map((e: EventResponse) => ({
          id: e.id!,
          title: e.title ?? '',
          start: new Date(e.startTime! + '+08:00'),
          end: new Date(e.endTime! + '+08:00'),
          allDay: e.allDay ?? false,
          resource: e,
        })),
    [events, showCompleted]
  )

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      openEditModal(event.id)
    },
    [openEditModal]
  )

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const fmt = (d: Date) => dayjs(d).format('YYYY-MM-DDTHH:mm')
      openCreateModal(fmt(start), fmt(end))
    },
    [openCreateModal]
  )

  const handleEventDrop: withDragAndDropProps<CalendarEvent>['onEventDrop'] = useCallback(
    ({ event, start, end, isAllDay }: Parameters<NonNullable<withDragAndDropProps<CalendarEvent>['onEventDrop']>>[0]) => {
      const allDay = isAllDay ?? event.resource.allDay ?? false
      updateMutation.mutate(
        { id: event.id, data: toUpdateBody(event.resource, new Date(start), new Date(end), allDay) },
        { onSuccess: () => toast.success('日程时间已调整') }
      )
    },
    [updateMutation]
  )

  const handleEventResize: withDragAndDropProps<CalendarEvent>['onEventResize'] = useCallback(
    ({ event, start, end }: Parameters<NonNullable<withDragAndDropProps<CalendarEvent>['onEventResize']>>[0]) => {
      updateMutation.mutate(
        { id: event.id, data: toUpdateBody(event.resource, new Date(start), new Date(end), event.resource.allDay ?? false) },
        { onSuccess: () => toast.success('日程时长已调整') }
      )
    },
    [updateMutation]
  )

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const color = event.resource.categoryColor ?? event.resource.color ?? 'var(--color-cal-today-ring)'
    const done = event.resource.status === 'COMPLETED' || event.resource.status === 'CANCELLED'
    return {
      style: {
        backgroundColor: color + (done ? '12' : '22'),
        borderRadius: '6px',
        border: 'none',
        borderLeft: `3px solid ${done ? color + '66' : color}`,
        color: done ? 'var(--color-event-done-text)' : 'var(--color-event-text)',
        fontSize: '12px',
        fontWeight: 500,
        padding: '2px 8px',
        opacity: done ? 0.75 : 1,
      },
    }
  }, [])

  const dayPropGetter = useCallback(
    (date: Date) => {
      const d = dayjs(date)
      if (d.isSame(dayjs(), 'day')) {
        return {
          style: { backgroundColor: 'var(--color-cal-today-bg)' },
        }
      }
      return {}
    },
    []
  )

  const EventItem = useCallback(({ event, title }: { event: CalendarEvent; title: string }) => {
    const { resource } = event
    const start = dayjs(resource.startTime!)
    const end = dayjs(resource.endTime!)
    const duration = end.diff(start, 'minute')
    const isLong = duration >= 120
    const done = resource.status === 'COMPLETED'
    let label = title
    if (!resource.allDay && duration > 0) {
      label = `${start.format('HH:mm')} ${label}`
    }
    return (
      <span className="group/event flex items-center gap-1 min-w-0">
        <button
          type="button"
          tabIndex={-1}
          title={done ? '恢复为计划中' : '标记完成'}
          onClick={(e) => {
            e.stopPropagation()
            toggleStatus.mutate(resource)
          }}
          className={cn(
            'flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all',
            done
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-border bg-surface/70 text-transparent opacity-0 group-hover/event:opacity-100 hover:border-emerald-400 hover:text-emerald-400'
          )}
        >
          {done ? <Check className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
        </button>
        <span className={cn('block truncate', isLong && 'font-semibold', done && 'line-through')}>
          {label}
        </span>
        {resource.status === 'CANCELLED' && (
          <RotateCcw className="w-2.5 h-2.5 flex-shrink-0 text-foreground-muted" />
        )}
      </span>
    )
  }, [toggleStatus])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="animate-pulse rounded-2xl bg-hover h-[65vh] w-[92%]" />
        <p className="text-sm text-foreground-muted">加载中...</p>
      </div>
    )
  }

  const isEmpty = !isLoading && calendarEvents.length === 0

  return (
    <div className="h-full calendar-container relative">
      <AnimatePresence>
        <motion.div
          key={view}
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <DnDCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            views={{ month: true, week: true, day: true, agenda: true }}
            view={view as View}
            date={currentDate.toDate()}
            onView={(v) => setView(v as CalendarView)}
            onNavigate={(d) => setCurrentDate(dayjs(d))}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            resizable
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
              event: EventItem,
            }}
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isEmpty && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hover mb-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <Plus className="w-7 h-7 text-foreground-muted" />
              </motion.div>
              <motion.p
                className="text-sm text-foreground-muted font-medium"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                暂无日程，点击空白区域或按 <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-hover rounded text-foreground-muted">N</kbd> 键创建
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CalendarToolbar({
  date,
  view,
  onView,
  onNavigate,
}: ToolbarProps<CalendarEvent>) {
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

  const btnClass = 'px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200'
  const activeClass = 'bg-accent text-accent-fg shadow-md'
  const inactiveClass = 'text-foreground-muted hover:text-foreground-secondary hover:bg-hover'

  const viewKeys = ['month', 'week', 'day', 'agenda'] as const
  const labels: Record<string, string> = { month: '月', week: '周', day: '日', agenda: '议程' }

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-surface/95 backdrop-blur border-b border-border-subtle">
      <div className="flex items-center bg-hover rounded-lg p-0.5 gap-0.5">
        {viewKeys.map((v, i) => (
          <button
            key={v}
            className={cn(btnClass, view === v ? activeClass : inactiveClass)}
            onClick={() => onView(v)}
            title={`${labels[v]}视图（${i + 1}）`}
          >
            {labels[v]}
          </button>
        ))}
      </div>

      <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{label}</h2>

      <div className="flex items-center gap-1">
        <button
          className={cn(btnClass, inactiveClass, 'text-base w-8 h-8 flex items-center justify-center')}
          onClick={() => onNavigate('PREV')}
          aria-label="上一页"
          title="上一页（←）"
        >
          ‹
        </button>
        <button
          className={cn(btnClass, inactiveClass, 'text-[12px]')}
          onClick={() => onNavigate('TODAY')}
          title="回到今天（T）"
        >
          今天
        </button>
        <button
          className={cn(btnClass, inactiveClass, 'text-base w-8 h-8 flex items-center justify-center')}
          onClick={() => onNavigate('NEXT')}
          aria-label="下一页"
          title="下一页（→）"
        >
          ›
        </button>
      </div>
    </div>
  )
}
