import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FoodActionList } from '../FoodActionList'
import { usePetStore } from '../../store/petStore'
import { useMyPet, useInteract, useShopItems, usePurchase } from '../../hooks/usePet'
import type { InteractionResult, PurchaseResult } from '@/api/types.gen'

vi.mock('../../hooks/usePet', () => ({
  useMyPet: vi.fn(),
  useInteract: vi.fn(),
  useShopItems: vi.fn(),
  usePurchase: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const SHOP_ITEM = { id: 1, name: '小鱼干', price: 10, effectHunger: 20, effectMood: 5 }
const ACCESSORY_ITEM = { id: 7, name: '巫师帽', type: 'ACCESSORY', price: 40, effectHunger: 0, effectMood: 0 }

describe('FoodActionList', () => {
  beforeEach(() => {
    usePetStore.getState().reset()
    vi.mocked(useMyPet).mockReturnValue({
      data: { coins: 100 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMyPet>)
    vi.mocked(useShopItems).mockReturnValue({
      data: [SHOP_ITEM],
      isLoading: false,
    } as ReturnType<typeof useShopItems>)
    vi.mocked(useInteract).mockReturnValue({ mutate: vi.fn(), isPending: false } as ReturnType<typeof useInteract>)
    vi.mocked(usePurchase).mockReturnValue({ mutate: vi.fn(), isPending: false } as ReturnType<typeof usePurchase>)
  })

  it('喂食成功触发 eat 动作（1.5s 后自动回 idle）', () => {
    vi.useFakeTimers()
    let onSuccess: ((r: InteractionResult) => void) | null = null
    vi.mocked(useInteract).mockReturnValue({
      mutate: (_args: unknown, opts: { onSuccess: (r: InteractionResult) => void }) => {
        onSuccess = opts.onSuccess
      },
      isPending: false,
    } as unknown as ReturnType<typeof useInteract>)

    render(<FoodActionList mode="feed" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: '喂食-小鱼干' }))

    expect(onSuccess).not.toBeNull()
    onSuccess?.({ moodChange: 5, hungerChange: 20, experienceGain: 10, coinChange: 0 } as InteractionResult)
    expect(usePetStore.getState().action).toBe('eat')

    vi.advanceTimersByTime(1500)
    expect(usePetStore.getState().action).toBe('idle')
    vi.useRealTimers()
  })

  it('购买成功触发 eat 动作（同路径进食反馈）', () => {
    vi.useFakeTimers()
    let onSuccess: ((r: PurchaseResult) => void) | null = null
    vi.mocked(usePurchase).mockReturnValue({
      mutate: (_args: unknown, opts: { onSuccess: (r: PurchaseResult) => void }) => {
        onSuccess = opts.onSuccess
      },
      isPending: false,
    } as unknown as ReturnType<typeof usePurchase>)

    render(<FoodActionList mode="shop" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: '购买-小鱼干' }))

    expect(onSuccess).not.toBeNull()
    onSuccess?.({ totalCost: 10 } as PurchaseResult)
    expect(usePetStore.getState().action).toBe('eat')

    vi.advanceTimersByTime(1500)
    expect(usePetStore.getState().action).toBe('idle')
    vi.useRealTimers()
  })

  it('ACCESSORY 显示「装备」按钮，购买即装备（开心情绪而非 eat）', () => {
    vi.mocked(useShopItems).mockReturnValue({
      data: [ACCESSORY_ITEM],
      isLoading: false,
    } as ReturnType<typeof useShopItems>)
    let onSuccess: ((r: PurchaseResult) => void) | null = null
    vi.mocked(usePurchase).mockReturnValue({
      mutate: (_args: unknown, opts: { onSuccess: (r: PurchaseResult) => void }) => {
        onSuccess = opts.onSuccess
      },
      isPending: false,
    } as unknown as ReturnType<typeof usePurchase>)

    render(<FoodActionList mode="shop" />, { wrapper })
    const equipBtn = screen.getByRole('button', { name: '装备-巫师帽' })
    expect(equipBtn).toBeEnabled()
    fireEvent.click(equipBtn)

    expect(onSuccess).not.toBeNull()
    onSuccess?.({ totalCost: 40, equippedAccessoryId: 7 } as PurchaseResult)
    expect(usePetStore.getState().emotionState).toBe('happy')
    expect(usePetStore.getState().action).not.toBe('eat') // 装备不呈现进食动作
  })

  it('已装备配饰 → 按钮禁用并显示「已装备」标记', () => {
    vi.mocked(useShopItems).mockReturnValue({
      data: [ACCESSORY_ITEM],
      isLoading: false,
    } as ReturnType<typeof useShopItems>)
    vi.mocked(useMyPet).mockReturnValue({
      data: { coins: 100, currentAccessory: 7 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMyPet>)

    render(<FoodActionList mode="shop" />, { wrapper })
    const equipBtn = screen.getByRole('button', { name: '装备-巫师帽' })
    expect(equipBtn).toBeDisabled()
    expect(equipBtn).toHaveTextContent('已装备')
    expect(screen.getByText('已装备', { selector: 'span' })).toBeTruthy()
  })
})
