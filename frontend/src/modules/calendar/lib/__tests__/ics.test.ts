import { describe, it, expect } from 'vitest'
import { buildICS } from '../ics'

describe('buildICS', () => {
  it('空列表返回有效 VCALENDAR 结构', () => {
    const result = buildICS([])
    expect(result).toContain('BEGIN:VCALENDAR')
    expect(result).toContain('END:VCALENDAR')
    expect(result).toContain('VERSION:2.0')
  })

  it('包含事件时生成 VEVENT 块', () => {
    const events = [
      {
        id: 1,
        title: '团队周会',
        description: '讨论本周进度',
        startTime: '2026-07-20T09:00:00',
        endTime: '2026-07-20T10:00:00',
        allDay: false,
        location: '3F 会议室',
        status: 'PLANNED' as const,
        categoryName: '工作',
        categoryColor: '#ff0000',
        tags: [],
        userId: 1,
      },
    ]
    const result = buildICS(events)
    expect(result).toContain('BEGIN:VEVENT')
    expect(result).toContain('SUMMARY:团队周会')
    expect(result).toContain('DESCRIPTION:讨论本周进度')
    expect(result).toContain('LOCATION:3F 会议室')
    expect(result).toContain('END:VEVENT')
  })

  it('全天事件使用 VALUE=DATE 格式', () => {
    const events = [
      {
        id: 2,
        title: '全天活动',
        description: '',
        startTime: '2026-07-20T00:00:00',
        endTime: '2026-07-21T00:00:00',
        allDay: true,
        status: 'PLANNED' as const,
        categoryName: '个人',
        categoryColor: '#00ff00',
        tags: [],
        userId: 1,
      },
    ]
    const result = buildICS(events)
    expect(result).toContain('VALUE=DATE')
  })

  it('特殊字符被转义', () => {
    const events = [
      {
        id: 3,
        title: '会议; 含逗号, 含换行\n第二行',
        description: '',
        startTime: '2026-07-20T09:00:00',
        endTime: '2026-07-20T10:00:00',
        allDay: false,
        status: 'PLANNED' as const,
        categoryName: '',
        categoryColor: '',
        tags: [],
        userId: 1,
      },
    ]
    const result = buildICS(events)
    expect(result).toContain('会议\\; 含逗号\\, 含换行\\n第二行')
  })
})
