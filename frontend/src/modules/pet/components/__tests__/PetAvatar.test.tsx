import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PetAvatar } from '../PetAvatar'
import { usePetStore } from '../../store/petStore'

// Mock @rive-app/react-canvas
vi.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({
    rive: null, // No animation loaded → triggers fallback
    RiveComponent: () => null,
  }),
}))

describe('PetAvatar', () => {
  beforeEach(() => {
    usePetStore.setState({ animationState: 'idle' })
  })

  it('fallback 为 cat emoji（idle 状态）', () => {
    render(<PetAvatar size={80} />)
    expect(screen.getByLabelText('宠物状态: idle')).toBeInTheDocument()
    expect(screen.getByLabelText('宠物状态: idle').textContent).toBe('🐱')
  })

  it('happy 状态显示开心 emoji', () => {
    usePetStore.setState({ animationState: 'happy' })
    render(<PetAvatar size={80} />)
    expect(screen.getByLabelText('宠物状态: happy').textContent).toBe('😸')
  })

  it('sad 状态显示伤心 emoji', () => {
    usePetStore.setState({ animationState: 'sad' })
    render(<PetAvatar size={80} />)
    expect(screen.getByLabelText('宠物状态: sad').textContent).toBe('😿')
  })

  it('hungry 状态显示饥饿 emoji', () => {
    usePetStore.setState({ animationState: 'hungry' })
    render(<PetAvatar size={80} />)
    expect(screen.getByLabelText('宠物状态: hungry').textContent).toBe('😾')
  })
})
