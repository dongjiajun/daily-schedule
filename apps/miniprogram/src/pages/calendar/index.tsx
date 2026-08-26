import { Text, View } from '@tarojs/components'
// NutUI 组件级按需引入（barrel 入口会带全量样式）
import Button from '@nutui/nutui-react-taro/dist/es/packages/button'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
import { useEffect, useMemo, useState } from 'react'
import {
  buildMonthGrid, formatMonthTitle, monthRange, todayKey,
} from '../../lib/calendar-date'
import { UnauthorizedError } from '../../lib/api'
import { fetchMonthEvents, groupEventsByDate, type EventSummary } from '../../lib/events'
import { wechatLogin } from '../../lib/auth'
import MonthGrid from '../../components/calendar/MonthGrid'
import EventDayList from '../../components/calendar/EventDayList'
import './index.scss'

/**
 * 日历月视图（只读）。
 *
 * 数据链路：月份游标 → 月网格范围（首格 00:00 ~ 末格次日 00:00）→ GET /events
 * （Bearer）→ 按日期键分组 → 网格色点 + 选中日列表。
 * 401：清除本地会话（lib/api.ts 已做）→ 静默重登 → 自动重拉，不打断浏览。
 * 切月时旧数据短暂保留（补位日重叠部分本就属于同一查询范围），加载完成即替换。
 */
export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [selectedKey, setSelectedKey] = useState(() => todayKey())
  const [events, setEvents] = useState<EventSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])
  const range = useMemo(() => monthRange(grid), [grid])
  const eventsByDate = useMemo(() => groupEventsByDate(events ?? []), [events])
  // 派生「加载中」：无数据且无错误（避免 effect 内同步 setState）
  const loading = events === null && error === null
  const selectedEvents = eventsByDate.get(selectedKey) ?? []

  useEffect(() => {
    let cancelled = false
    fetchMonthEvents(range.start, range.end)
      .then(list => {
        if (!cancelled) {
          setEvents(list)
          setError(null)
        }
      })
      .catch(err => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) {
          // 401：静默重登（wx.login 无感）→ 自动重拉
          wechatLogin()
            .then(() => fetchMonthEvents(range.start, range.end))
            .then(list => {
              if (!cancelled) {
                setEvents(list)
                setError(null)
              }
            })
            .catch(loginErr => {
              if (!cancelled) {
                setError(loginErr instanceof Error ? loginErr.message : '登录已失效，请重试')
              }
            })
        } else {
          setError(err instanceof Error ? err.message : '加载失败，请重试')
        }
      })
    return () => {
      cancelled = true
    }
  }, [range.start, range.end, reloadKey])

  const prevMonth = () => setCursor(c => (
    c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 }
  ))
  const nextMonth = () => setCursor(c => (
    c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 }
  ))
  const retry = () => {
    setError(null)
    setReloadKey(k => k + 1)
  }

  return (
    <View className='mp-cal-page'>
      <View className='mp-cal-header'>
        <View className='mp-cal-nav-btn' onClick={prevMonth}><Text>‹</Text></View>
        <Text className='mp-cal-title'>{formatMonthTitle(cursor.year, cursor.month)}</Text>
        <View className='mp-cal-nav-btn' onClick={nextMonth}><Text>›</Text></View>
      </View>

      <MonthGrid
        grid={grid}
        eventsByDate={eventsByDate}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
      />

      <View className='mp-cal-day-section'>
        <Text className='mp-cal-day-title'>{selectedKey} 日程</Text>
        {loading ? (
          <Text className='mp-cal-status'>加载中…</Text>
        ) : error ? (
          <View className='mp-cal-error'>
            <Text className='mp-cal-status'>{error}</Text>
            <Button type='primary' plain size='small' onClick={retry}>重试</Button>
          </View>
        ) : (
          <EventDayList events={selectedEvents} />
        )}
      </View>
    </View>
  )
}
