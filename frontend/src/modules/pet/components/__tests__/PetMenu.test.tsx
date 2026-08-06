import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PetMenu } from '../PetMenu'
import { usePetStore } from '../../store/petStore'
import { useMyPet, useShopItems, useInteract, usePurchase } from '../../hooks/usePet'

vi.mock('../../hooks/usePet', () => ({
  useMyPet: vi.fn(),
  useCreatePet: vi.fn(),
  useInteract: vi.fn(),
  useShopItems: vi.fn(),
  usePurchase: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const SHOP_ITEMS = [
  { id: 1, name: '小鱼干', type: 'FOOD', price: 10, effectMood: 5, effectHunger: 20, effectExperience: 3 },
  { id: 6, name: '玩具球', type: 'FOOD', price: 5, effectMood: 15, effectHunger: 0, effectExperience: 5 },
]

describe('PetMenu', () => {
  const interactMutate = vi.fn()
  const purchaseMutate = vi.fn()

  beforeEach(() => {
    usePetStore.setState({
      coins: 0,
      particleTrigger: null,
      feedbackTrigger: null,
    } as never)
    vi.mocked(useMyPet).mockReturnValue({
      data: { id: 1, species: 'SHIBA_INU', name: '测试', level: 1, coins: 20 },
      isLoading: false,
      isError: false,
      dataUpdatedAt: 0,
      error: null,
    } as never)
    vi.mocked(useShopItems).mockReturnValue({
      data: SHOP_ITEMS,
      isLoading: false,
      isError: false,
      dataUpdatedAt: 0,
      error: null,
    } as never)
    vi.mocked(useInteract).mockReturnValue({
      mutate: interactMutate,
      isPending: false,
    } as never)
    vi.mocked(usePurchase).mockReturnValue({
      mutate: purchaseMutate,
      isPending: false,
    } as never)
    interactMutate.mockClear()
    purchaseMutate.mockClear()
  })

  it('打开时展示食物列表与金币余额', () => {
    render(<PetMenu open onOpenChange={() => {}} />, { wrapper })
    expect(screen.getByText('小鱼干')).toBeInTheDocument()
    expect(screen.getByText('玩具球')).toBeInTheDocument()
    expect(screen.getByText(/🪙 20/)).toBeInTheDocument()
  })

  it('点击喂食 → interact FEED with itemId', () => {
    render(<PetMenu open onOpenChange={() => {}} />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: '喂食-小鱼干' }))
    expect(interactMutate).toHaveBeenCalledWith(
      { type: 'FEED', itemId: 1 },
      expect.anything()
    )
  })

  it('玩耍按钮 → interact PLAY', () => {
    render(<PetMenu open onOpenChange={() => {}} />, { wrapper })
    fireEvent.click(screen.getByText(/玩耍/))
    expect(interactMutate).toHaveBeenCalledWith({ type: 'PLAY' }, expect.anything())
  })

  it('金币不足时按钮禁用', () => {
    vi.mocked(useMyPet).mockReturnValue({
      data: { id: 1, species: 'SHIBA_INU', name: '测试', level: 1, coins: 3 },
      isLoading: false,
      isError: false,
      dataUpdatedAt: 0,
      error: null,
    } as never)
    render(<PetMenu open onOpenChange={() => {}} />, { wrapper })
    const feedBtn = screen.getByRole('button', { name: '喂食-小鱼干' })
    expect(feedBtn).toBeDisabled()
    expect(feedBtn).toHaveAttribute('title', '专注币不足')
  })

  it('切到商店 tab → 点击购买 → purchase with itemId', () => {
    render(<PetMenu open onOpenChange={() => {}} />, { wrapper })
    fireEvent.click(screen.getByText('商店'))
    fireEvent.click(screen.getByRole('button', { name: '购买-小鱼干' }))
    expect(purchaseMutate).toHaveBeenCalledWith({ itemId: 1, quantity: 1 }, expect.anything())
  })

  it('喂食成功 → 浮动数值与 food 粒子触发', () => {
    const triggerFeedback = vi.spyOn(usePetStore.getState(), 'triggerFeedback')
    const triggerParticle = vi.spyOn(usePetStore.getState(), 'triggerParticle')
    interactMutate.mockImplementationOnce((_data: unknown, opts: { onSuccess?: (r: unknown) => void }) => {
      opts.onSuccess?.({ moodChange: 5, hungerChange: 20, experienceGain: 3, coinChange: -10 })
    })
    render(<PetMenu open onOpenChange={() => {}} />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: '喂食-小鱼干' }))
    expect(triggerParticle).toHaveBeenCalledWith('food')
    const items = triggerFeedback.mock.calls[0][0]
    expect(items.some((i: { text: string }) => i.text === '+20 饱腹')).toBe(true)
    expect(items.some((i: { text: string }) => i.text === '-10 金币')).toBe(true)
  })
})
