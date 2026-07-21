import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PetStatus } from '../PetStatus'
import type { PetProfile } from '@/api/types.gen'

const samplePet: PetProfile = {
  id: 1,
  species: 'ORANGE_CAT',
  name: '大橘',
  mood: 80,
  hunger: 90,
  coins: 150,
  level: 3,
  experience: 500,
}

describe('PetStatus', () => {
  it('渲染 mood/hunger/coins/level', () => {
    render(<PetStatus pet={samplePet} isLoading={false} />)
    expect(screen.getByTestId('pet-status')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('⭐ Lv.3')).toBeInTheDocument()
  })

  it('loading 时显示 skeleton', () => {
    render(<PetStatus pet={undefined} isLoading />)
    expect(screen.getByTestId('pet-status-skeleton')).toBeInTheDocument()
  })

  it('无宠物时不渲染', () => {
    const { container } = render(<PetStatus pet={undefined} isLoading={false} />)
    expect(container.innerHTML).toBe('')
  })
})
