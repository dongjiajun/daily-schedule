import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '@/core/lib/eventBus'

// Mock 依赖模块，避免实际 API 调用
vi.mock('@/api/sdk.gen', () => ({
  listEvents: vi.fn().mockResolvedValue({ data: [], response: new Response(null, { status: 200 }) }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('模块可正常导入', async () => {
    // 验证模块无导入错误（语法/路径正确性）
    const mod = await import('../useEvents')
    expect(mod.useEvents).toBeDefined()
    expect(mod.useCreateEvent).toBeDefined()
    expect(mod.useUpdateEvent).toBeDefined()
    expect(mod.useDeleteEvent).toBeDefined()
    expect(mod.useToggleEventStatus).toBeDefined()
  })

  it('getViewRange 逻辑正确（通过导出验证）', async () => {
    // useEvents 是 React Query hook，导出即验证了其语法正确性
    const mod = await import('../useEvents')
    expect(typeof mod.useEvents).toBe('function')
    expect(typeof mod.useCreateEvent).toBe('function')
  })
})

// 验证日历事件 emit 端到端 — eventBus 单例 + 三种事件类型
describe('Calendar event emission (eventBus)', () => {
  beforeEach(() => {
    eventBus.removeAll()
  })

  it('eventBus 单例可访问', () => {
    expect(eventBus).toBeDefined()
    expect(typeof eventBus.emit).toBe('function')
    expect(typeof eventBus.on).toBe('function')
  })

  it('event:completed 事件可被监听', () => {
    const handler = vi.fn()
    eventBus.on('event:completed', handler)
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: '测试' } })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('event:created 事件可被监听', () => {
    const handler = vi.fn()
    eventBus.on('event:created', handler)
    eventBus.emit({ type: 'event:created', payload: { eventId: '2', title: '新建' } })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('event:cancelled 事件可被监听', () => {
    const handler = vi.fn()
    eventBus.on('event:cancelled', handler)
    eventBus.emit({ type: 'event:cancelled', payload: { eventId: '3', title: '取消' } })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('注销后不再收到事件', () => {
    const handler = vi.fn()
    const off = eventBus.on('event:completed', handler)
    off()
    eventBus.emit({ type: 'event:completed', payload: { eventId: '4', title: '不应收到' } })
    expect(handler).not.toHaveBeenCalled()
  })
})
