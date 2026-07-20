import dayjs from 'dayjs'
import type { EventResponse } from '../../api/types.gen'

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function fmtLocal(time: string): string {
  return dayjs(time).format('YYYYMMDDTHHmmss')
}

function fmtDate(time: string): string {
  return dayjs(time).format('YYYYMMDD')
}

/**
 * 把日程导出为 iCalendar (.ics) 文本，可导入到系统日历 /
 * Google Calendar / Outlook 等。时间按本地时区（Asia/Shanghai）落盘。
 */
export function buildICS(events: EventResponse[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//daily-schedule//v3.1//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  const stamp = dayjs().format('YYYYMMDDTHHmmss')
  for (const e of events) {
    if (!e.startTime || !e.endTime) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:event-${e.id}@daily-schedule`)
    lines.push(`DTSTAMP:${stamp}`)
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${fmtDate(e.startTime)}`)
      lines.push(`DTEND;VALUE=DATE:${fmtDate(dayjs(e.endTime).add(1, 'day').toISOString())}`)
    } else {
      lines.push(`DTSTART;TZID=Asia/Shanghai:${fmtLocal(e.startTime)}`)
      lines.push(`DTEND;TZID=Asia/Shanghai:${fmtLocal(e.endTime)}`)
    }
    lines.push(`SUMMARY:${escapeText(e.title ?? '')}`)
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`)
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`)
    if (e.categoryName) lines.push(`CATEGORIES:${escapeText(e.categoryName)}`)
    if (e.status === 'CANCELLED') lines.push('STATUS:CANCELLED')
    else lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(events: EventResponse[], filename = 'schedule.ics') {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
