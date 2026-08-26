import { beforeEach, describe, expect, it, vi } from 'vitest'

// events.ts 依赖的请求层整体 mock（单测只验证数据层自身的解析/分组/错误语义）
vi.mock('../lib/api', () => ({
  apiRequest: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}))

import { apiRequest } from '../lib/api'
import { fetchMonthEvents, groupEventsByDate, parseEventSummary } from '../lib/events'

const apiRequestMock = vi.mocked(apiRequest)

const VALID_EVENT = {
  id: 7,
  title: '产品评审',
  startTime: '2026-08-22T09:05:00',
  endTime: '2026-08-22T10:30:00',
  allDay: false,
  color: '#f97316',
  categoryName: '工作',
}

describe('parseEventSummary', () => {
  it('完整字段 → 规范化 EventSummary', () => {
    const summary = parseEventSummary(VALID_EVENT)
    expect(summary).toEqual(VALID_EVENT)
  })

  it('可选字段缺失 → 归一为 undefined', () => {
    const summary = parseEventSummary({
      id: 1,
      title: '只有必填',
      startTime: '2026-08-22T09:00:00',
      allDay: false,
    })
    expect(summary.endTime).toBeUndefined()
    expect(summary.color).toBeUndefined()
    expect(summary.categoryName).toBeUndefined()
  })

  it('缺 title → 抛「日程数据格式异常」', () => {
    expect(() => parseEventSummary({ id: 1, startTime: '2026-08-22T09:00:00', allDay: false }))
      .toThrow('日程数据格式异常')
  })

  it('allDay 非布尔 → 抛异常', () => {
    expect(() => parseEventSummary({ id: 1, title: 'x', startTime: '2026-08-22T09:00:00', allDay: 'yes' }))
      .toThrow('日程数据格式异常')
  })

  it('startTime 为空串 → 抛异常', () => {
    expect(() => parseEventSummary({ id: 1, title: 'x', startTime: '', allDay: false }))
      .toThrow('日程数据格式异常')
  })
})

describe('groupEventsByDate', () => {
  it('按 startTime 日期键分组且组内升序', () => {
    const grouped = groupEventsByDate([
      { id: 2, title: '晚', startTime: '2026-08-22T20:00:00', allDay: false },
      { id: 1, title: '早', startTime: '2026-08-22T09:00:00', allDay: false },
      { id: 3, title: '次日', startTime: '2026-08-23T08:00:00', allDay: false },
    ])
    expect([...grouped.keys()]).toEqual(['2026-08-22', '2026-08-23'])
    expect(grouped.get('2026-08-22')?.map(e => e.id)).toEqual([1, 2])
  })

  it('空数组 → 空 Map', () => {
    expect(groupEventsByDate([]).size).toBe(0)
  })
})

describe('fetchMonthEvents', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
  })

  it('合法数组 → EventSummary[]，且查询参数正确（size=100 单页）', async () => {
    apiRequestMock.mockResolvedValue([VALID_EVENT])
    const events = await fetchMonthEvents('2026-07-27T00:00:00', '2026-09-07T00:00:00')
    expect(events).toEqual([VALID_EVENT])
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/events?start=2026-07-27T00%3A00%3A00&end=2026-09-07T00%3A00%3A00&size=100&page=1'
    )
  })

  it('响应非数组 → 抛「日程数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue({ events: [] })
    await expect(fetchMonthEvents('2026-01-01T00:00:00', '2026-02-01T00:00:00'))
      .rejects.toThrow('日程数据格式异常')
  })

  it('数组内元素非法 → 抛「日程数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue([{ id: 1, startTime: 'x' }])
    await expect(fetchMonthEvents('2026-01-01T00:00:00', '2026-02-01T00:00:00'))
      .rejects.toThrow('日程数据格式异常')
  })

  it('请求层抛后端错误 → 原样上抛（message 透传）', async () => {
    apiRequestMock.mockRejectedValue(new Error('登录凭证无效或已过期'))
    await expect(fetchMonthEvents('2026-01-01T00:00:00', '2026-02-01T00:00:00'))
      .rejects.toThrow('登录凭证无效或已过期')
  })
})
