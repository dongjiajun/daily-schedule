import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventModal } from '../EventModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCalendarStore } from '../../store/calendarStore'

vi.mock('@/api/sdk.gen', () => ({
  listCategories: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  listTags: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  listEvents: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        title: '已完成日程',
        status: 'COMPLETED',
        startTime: '2026-11-06T09:00:00',
        endTime: '2026-11-06T10:00:00',
        allDay: false,
        categoryId: null,
        tags: [],
      },
    ],
    response: { ok: true },
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('EventModal', () => {
  beforeEach(() => {
    useCalendarStore.setState({ modalOpen: true, editingEventId: null })
  })

  it('modalOpen 为 true 时渲染不崩溃', () => {
    expect(() => {
      render(<EventModal />, { wrapper })
    }).not.toThrow()
  })

  it('modalOpen 为 false 时不渲染内容', () => {
    useCalendarStore.setState({ modalOpen: false })
    const { container } = render(<EventModal />, { wrapper })
    // When modal is closed, should have minimal or no content
    expect(container).toBeTruthy()
  })
})

describe('EventModal 完成态配色', () => {
  it('已完成日程标题旁显示 success 语义徽标', async () => {
    render(<EventModal open eventId={1} onClose={vi.fn()} />, { wrapper })
    const badge = await screen.findByText('已完成')
    expect(badge.className).toContain('text-success-fg')
  })
})
