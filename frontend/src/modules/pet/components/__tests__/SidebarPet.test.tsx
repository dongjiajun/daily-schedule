import { describe, it, expect, vi } from 'vitest'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../../hooks/usePet', () => ({
  useMyPet: () => ({ data: null, isLoading: false }),
}))

describe('SidebarPet', () => {
  it('模块可导入', async () => {
    const mod = await import('../SidebarPet')
    expect(mod.SidebarPet).toBeDefined()
    expect(typeof mod.SidebarPet).toBe('function')
  })
})
