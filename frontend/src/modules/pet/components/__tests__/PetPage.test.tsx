import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PetPage from '../PetPage'
import { usePetStore } from '../../store/petStore'
import {
  useMyPet,
  useEquippedAccessoryName,
  useUnequip,
  useInteract,
  useUpdatePet,
  useShopItems,
  usePurchase,
} from '../../hooks/usePet'
import type { PetProfile } from '@/api/types.gen'

vi.mock('../../hooks/usePet', () => ({
  useMyPet: vi.fn(),
  useEquippedAccessoryName: vi.fn(),
  useUnequip: vi.fn(),
  useInteract: vi.fn(),
  useUpdatePet: vi.fn(),
  useShopItems: vi.fn(),
  usePurchase: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const SAMPLE_PET: PetProfile = {
  id: 1,
  species: 'ORANGE_CAT',
  name: '小橘',
  mood: 85,
  hunger: 75,
  coins: 120,
  level: 2,
  experience: 140,
}

describe('PetPage', () => {
  const interactMutate = vi.fn()
  const updateMutate = vi.fn()

  beforeEach(() => {
    usePetStore.getState().reset()
    interactMutate.mockReset()
    updateMutate.mockReset()

    vi.mocked(useMyPet).mockReturnValue({
      data: SAMPLE_PET,
      isLoading: false,
    } as unknown as ReturnType<typeof useMyPet>)
    vi.mocked(useEquippedAccessoryName).mockReturnValue(null)
    vi.mocked(useUnequip).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUnequip>)
    vi.mocked(useInteract).mockReturnValue({ mutate: interactMutate, isPending: false } as unknown as ReturnType<typeof useInteract>)
    vi.mocked(useUpdatePet).mockReturnValue({ mutate: updateMutate, isPending: false } as unknown as ReturnType<typeof useUpdatePet>)
    vi.mocked(useShopItems).mockReturnValue({
      data: [
        { id: 1, name: '小鱼干', type: 'FOOD', price: 10, effectHunger: 20, effectMood: 5 },
        { id: 7, name: '巫师帽', type: 'ACCESSORY', price: 40, effectHunger: 0, effectMood: 0 },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useShopItems>)
    vi.mocked(usePurchase).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof usePurchase>)
  })

  it('加载中渲染 Skeleton 占位', () => {
    vi.mocked(useMyPet).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useMyPet>)
    const { container } = render(<PetPage />, { wrapper })
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('无宠物时渲染 EmptyState 且点击领养伙伴打开选择弹窗', () => {
    vi.mocked(useMyPet).mockReturnValue({ data: undefined, isLoading: false } as unknown as ReturnType<typeof useMyPet>)
    render(<PetPage />, { wrapper })
    expect(screen.getByText('你还没有宠物')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '领养伙伴' }))
    expect(usePetStore.getState().selectionOpen).toBe(true)
  })

  it('渲染 200px 主头像、去重喂食/装扮区、汉化物种与直接玩耍按钮', () => {
    const { container } = render(<PetPage />, { wrapper })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('200')
    expect(svg.style.transform).toBe('')

    expect(screen.getByText('橘猫')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '喂食-小鱼干' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '装备-巫师帽' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /玩耍（免费）/ }))
    expect(interactMutate).toHaveBeenCalledWith({ type: 'PLAY' }, expect.any(Object))
  })

  it('内联改名支持提交合法名称并拦截空白名称', () => {
    render(<PetPage />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: '改名' }))

    const input = screen.getByLabelText('宠物名称')
    const saveBtn = screen.getByRole('button', { name: '保存' })

    fireEvent.change(input, { target: { value: '   ' } })
    expect(saveBtn).toBeDisabled()

    fireEvent.change(input, { target: { value: '二橘' } })
    expect(saveBtn).toBeEnabled()
    fireEvent.click(saveBtn)
    expect(updateMutate).toHaveBeenCalledWith({ name: '二橘' }, expect.any(Object))
  })
})
