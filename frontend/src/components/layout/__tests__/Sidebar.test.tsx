import { describe, it, expect, vi } from 'vitest'

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/modules/pet/components/SidebarPet', () => ({
  SidebarPet: () => null,
}))

describe('Sidebar', () => {
  it('模块可导入', async () => {
    const mod = await import('../Sidebar')
    expect(mod.Sidebar).toBeDefined()
  })
})
