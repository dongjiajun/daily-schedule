import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PetPanel } from '../PetPanel'
import { usePetStore } from '../../store/petStore'

// Mock useRive
vi.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({ rive: null, RiveComponent: () => null }),
}))

// Mock API hooks
const mockPetData = {
  id: 1, species: 'ORANGE_CAT', name: '大橘',
  mood: 80, hunger: 90, coins: 100, level: 2, experience: 200,
}

vi.mock('../../hooks/usePet', () => ({
  useMyPet: vi.fn(),
  useCreatePet: () => ({ mutate: vi.fn(), isPending: false }),
  useInteract: () => ({ mutate: vi.fn(), isPending: false }),
  useShopItems: () => ({ data: [] }),
  usePurchase: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { useMyPet } from '../../hooks/usePet'
const mockedUseMyPet = useMyPet as ReturnType<typeof vi.fn>

describe('PetPanel', () => {
  beforeEach(() => {
    usePetStore.setState({
      animationState: 'idle',
      bubbleMessage: null,
      menuOpen: false,
      selectionOpen: false,
    })
    mockedUseMyPet.mockReturnValue({ data: undefined, isLoading: false, isError: false })
  })

  it('无宠物时自动打开选择框', () => {
    mockedUseMyPet.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<PetPanel />)
    // isError → useEffect sets selectionOpen=true → PetSelection dialog renders
    expect(screen.getByText('选择你的伙伴')).toBeInTheDocument()
  })

  it('有宠物时展示状态', () => {
    mockedUseMyPet.mockReturnValue({ data: mockPetData, isLoading: false, isError: false })
    render(<PetPanel />)
    expect(screen.getByTestId('pet-status')).toBeInTheDocument()
  })

  it('loading 时显示 spinner', () => {
    mockedUseMyPet.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<PetPanel />)
    // PetAvatar fallback renders; PetStatus skeleton should appear
    expect(screen.getByLabelText(/宠物状态/)).toBeInTheDocument()
  })
})
