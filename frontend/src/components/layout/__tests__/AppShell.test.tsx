import { describe, it, expect, vi } from 'vitest'

vi.mock('react-router-dom', () => ({
  Outlet: () => null,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/modules/pet/components/SidebarPet', () => ({
  SidebarPet: () => null,
}))

vi.mock('@/modules/pet/store/petStore', () => ({
  usePetStore: () => ({}),
}))

describe('AppShell', () => {
  it('模块可导入', async () => {
    const mod = await import('../AppShell')
    expect(mod.AppShell).toBeDefined()
  })
})
