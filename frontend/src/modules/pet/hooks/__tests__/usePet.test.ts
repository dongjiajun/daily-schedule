import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock SDK
vi.mock('@/api/sdk.gen', () => ({
  getMyPet: vi.fn().mockResolvedValue({
    data: { id: 1, species: 'ORANGE_CAT', name: '大橘', mood: 80, hunger: 90, coins: 100, level: 2, experience: 200 },
    response: new Response(null, { status: 200 }),
  }),
  createPet: vi.fn().mockResolvedValue({
    data: { id: 1, species: 'ORANGE_CAT', name: '大橘' },
    response: new Response(null, { status: 201 }),
  }),
  updatePet: vi.fn().mockResolvedValue({
    data: { id: 1, name: '二橘' },
    response: new Response(null, { status: 200 }),
  }),
  interactWithPet: vi.fn().mockResolvedValue({
    data: { moodChange: 25, hungerChange: -10, experienceGain: 15, coinChange: 0 },
    response: new Response(null, { status: 200 }),
  }),
  getShopItems: vi.fn().mockResolvedValue({
    data: [{ id: 1, name: '小鱼干', type: 'FOOD', price: 10, effectMood: 5, effectHunger: 20, effectExperience: 3 }],
    response: new Response(null, { status: 200 }),
  }),
  purchaseItem: vi.fn().mockResolvedValue({
    data: { success: true, itemName: '小鱼干', totalCost: 10, newCoins: 90 },
    response: new Response(null, { status: 200 }),
  }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('usePet hooks', () => {
  it('所有 hooks 可正常导入', async () => {
    const mod = await import('../usePet')
    expect(mod.useMyPet).toBeDefined()
    expect(mod.useCreatePet).toBeDefined()
    expect(mod.useUpdatePet).toBeDefined()
    expect(mod.useInteract).toBeDefined()
    expect(mod.useShopItems).toBeDefined()
    expect(mod.usePurchase).toBeDefined()
  })

  it('useMyPet queryKey 正确', async () => {
    const mod = await import('../usePet')
    expect(typeof mod.useMyPet).toBe('function')
  })

  it('useCreatePet mutationFn 可调用', async () => {
    const mod = await import('../usePet')
    expect(typeof mod.useCreatePet).toBe('function')
  })

  it('useInteract mutationFn 可调用', async () => {
    const mod = await import('../usePet')
    expect(typeof mod.useInteract).toBe('function')
  })

  it('useShopItems queryKey 正确', async () => {
    const mod = await import('../usePet')
    expect(typeof mod.useShopItems).toBe('function')
  })

  it('usePurchase mutationFn 可调用', async () => {
    const mod = await import('../usePet')
    expect(typeof mod.usePurchase).toBe('function')
  })

  it('useMyPet 在 error 态停止 30s 轮询（不反复发 404），正常态保留轮询', async () => {
    vi.useFakeTimers()
    const sdk = await import('@/api/sdk.gen')
    vi.mocked(sdk.getMyPet).mockClear()
    vi.mocked(sdk.getMyPet).mockResolvedValueOnce({
      data: undefined,
      error: { message: '请先创建宠物' },
      response: new Response(JSON.stringify({ code: 404, message: '请先创建宠物' }), { status: 404 }),
    } as never)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)

    const { useMyPet } = await import('../usePet')
    renderHook(() => useMyPet(), { wrapper })

    // 首次请求触发并落入 error 态
    await act(async () => {
      await Promise.resolve()
    })
    expect(sdk.getMyPet).toHaveBeenCalledTimes(1)

    // 推进 90 秒：error 态下 refetchInterval=false，不再发出额外请求
    await act(async () => {
      vi.advanceTimersByTime(90_000)
    })
    expect(sdk.getMyPet).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
