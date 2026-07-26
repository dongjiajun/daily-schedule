import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api/sdk.gen', () => ({
  listCategories: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  listTags: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
}))

vi.mock('../../../lib/ics', () => ({
  buildICS: vi.fn().mockReturnValue(''),
}))

describe('CalendarSidebar', () => {
  it('模块可导入', async () => {
    const mod = await import('../CalendarSidebar')
    expect(mod.CalendarSidebar).toBeDefined()
  })
})
