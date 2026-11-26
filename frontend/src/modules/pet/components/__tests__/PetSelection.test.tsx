import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PetSelection } from '../PetSelection'
import { usePetStore } from '../../store/petStore'

// Mock API hooks
vi.mock('../../hooks/usePet', () => ({
  useCreatePet: () => ({ mutate: vi.fn(), isPending: false }),
  useMyPet: () => ({ data: undefined, isLoading: false, isError: false }),
  useShopItems: () => ({ data: [] }),
  usePurchase: () => ({ mutate: vi.fn() }),
}))

// Mock lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react')
  return { ...actual }
})

describe('PetSelection', () => {
  beforeEach(() => {
    usePetStore.getState().reset()
    usePetStore.setState({ selectionOpen: true, selectionDismissed: false })
  })

  it('渲染两种物种选择', () => {
    render(<PetSelection />)
    expect(screen.getByText('橘猫')).toBeInTheDocument()
    expect(screen.getByText('柴犬')).toBeInTheDocument()
  })

  it('空名称时确认按钮 disabled', () => {
    render(<PetSelection />)
    expect(screen.getByRole('button', { name: /确认选择/ })).toBeDisabled()
  })

  it('输入名称后可提交', async () => {
    render(<PetSelection />)
    const input = screen.getByPlaceholderText(/起个名字/)
    await userEvent.type(input, '大橘')
    expect(screen.getByRole('button', { name: /确认选择/ })).not.toBeDisabled()
  })

  it('主动关闭弹窗设置 selectionDismissed=true（本会话免打扰）', () => {
    render(<PetSelection />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(usePetStore.getState().selectionOpen).toBe(false)
    expect(usePetStore.getState().selectionDismissed).toBe(true)
  })
})
