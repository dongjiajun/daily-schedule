import { apiRequest } from './api'
import { eventDateKey } from './calendar-date'

/**
 * 日程数据层（月视图只读）。
 *
 * 复用后端 `GET /api/v1/events`（裸数组 EventResponse[]），
 * 消费字段子集（EventSummary），响应做数组与字段校验（纯函数可单测）。
 */

export interface EventSummary {
  id: number
  title: string
  /** 后端 LocalDateTime 序列化（YYYY-MM-DDTHH:mm:ss，无时区偏移） */
  startTime: string
  endTime?: string
  allDay: boolean
  color?: string
  categoryName?: string
}

/** 校验并规范化单个事件（失败抛「日程数据格式异常」） */
export function parseEventSummary(raw: unknown): EventSummary {
  const p = (raw ?? {}) as Record<string, unknown>
  const id = p.id
  const title = p.title
  const startTime = p.startTime
  const allDay = p.allDay
  if (typeof id !== 'number'
      || typeof title !== 'string' || title === ''
      || typeof startTime !== 'string' || startTime === ''
      || typeof allDay !== 'boolean') {
    throw new Error('日程数据格式异常')
  }
  const summary: EventSummary = { id, title, startTime, allDay }
  if (typeof p.endTime === 'string') summary.endTime = p.endTime
  if (typeof p.color === 'string') summary.color = p.color
  if (typeof p.categoryName === 'string') summary.categoryName = p.categoryName
  return summary
}

/** 按日期键分组（键 = startTime 所在日期），每组内 startTime 升序 */
export function groupEventsByDate(events: EventSummary[]): Map<string, EventSummary[]> {
  const map = new Map<string, EventSummary[]>()
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime))
  for (const event of sorted) {
    const key = eventDateKey(event.startTime)
    const list = map.get(key)
    if (list) {
      list.push(event)
    } else {
      map.set(key, [event])
    }
  }
  return map
}

/**
 * 拉取月网格范围内的日程（size=100 单页，Decision 7）。
 * @param start 网格首格 00:00:00
 * @param end 网格末格次日 00:00:00（排他上界）
 */
export async function fetchMonthEvents(start: string, end: string): Promise<EventSummary[]> {
  const query = `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&size=100&page=1`
  const data = await apiRequest<unknown>(`/events?${query}`)
  if (!Array.isArray(data)) {
    throw new Error('日程数据格式异常')
  }
  return data.map(parseEventSummary)
}
