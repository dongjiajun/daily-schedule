import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PetBubble } from '../PetBubble'
import { usePetStore } from '../../store/petStore'

describe('PetBubble', () => {
  beforeEach(() => {
    usePetStore.setState({ bubbleMessage: null })
  })

  it('有消息时渲染气泡', () => {
    usePetStore.setState({ bubbleMessage: '太棒了！' })
    render(<PetBubble />)
    expect(screen.getByText('太棒了！')).toBeInTheDocument()
  })

  it('无消息时不渲染', () => {
    const { container } = render(<PetBubble />)
    expect(container.textContent).toBe('')
  })
})
