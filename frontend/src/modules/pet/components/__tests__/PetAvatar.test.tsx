import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PetAvatar } from '../PetAvatar'
import { usePetStore } from '../../store/petStore'
import { useMyPet } from '../../hooks/usePet'

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

describe('PetAvatar', () => {
  beforeEach(() => {
    usePetStore.setState({
      animationState: 'idle',
      emotionState: 'idle',
      position: { x: 0, y: 0 },
      facing: 'right',
    })
    vi.mocked(useMyPet).mockReturnValue({
      data: { species: 'ORANGE_CAT', name: '测试', level: 1 },
      isLoading: false,
      isError: false,
      dataUpdatedAt: 0,
      error: null,
    } as ReturnType<typeof useMyPet>)
  })

  it('渲染 SVG 插画（idle 状态）', () => {
    render(<PetAvatar size={80} />, { wrapper })
    expect(screen.getByLabelText('宠物状态: idle')).toBeInTheDocument()
    expect(screen.getByLabelText('宠物状态: idle').querySelector('svg')).toBeTruthy()
  })

  it('happy 状态渲染正确 aria-label', () => {
    usePetStore.setState({ emotionState: 'happy', animationState: 'happy' })
    render(<PetAvatar size={80} />, { wrapper })
    expect(screen.getByLabelText('宠物状态: happy')).toBeInTheDocument()
  })

  it('sad 状态渲染正确', () => {
    usePetStore.setState({ emotionState: 'sad', animationState: 'sad' })
    render(<PetAvatar size={80} />, { wrapper })
    expect(screen.getByLabelText('宠物状态: sad')).toBeInTheDocument()
  })

  it('hungry 状态渲染正确', () => {
    usePetStore.setState({ emotionState: 'hungry', animationState: 'hungry' })
    render(<PetAvatar size={80} />, { wrapper })
    expect(screen.getByLabelText('宠物状态: hungry')).toBeInTheDocument()
  })

  it('eat 动作渲染 data-action="eat"（SVG 动画层）', () => {
    usePetStore.setState({ action: 'eat' })
    render(<PetAvatar size={80} />, { wrapper })
    const svg = screen.getByLabelText('宠物状态: idle').querySelector('svg')
    expect(svg?.getAttribute('data-action')).toBe('eat')
  })

  it('小动作渲染 data-action（stretch/yawn/scratch/look）', () => {
    for (const action of ['stretch', 'yawn', 'scratch', 'look'] as const) {
      usePetStore.setState({ action })
      const { unmount } = render(<PetAvatar size={80} />, { wrapper })
      const svg = screen.getByLabelText('宠物状态: idle').querySelector('svg')
      expect(svg?.getAttribute('data-action')).toBe(action)
      unmount()
    }
  })
})
