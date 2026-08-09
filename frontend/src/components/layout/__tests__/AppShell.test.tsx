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
  // 动态 import 需加载整棵模块树（含宠物模块），turbo 并行/CI 资源紧张时
  // 默认 5s 超时会被环境抖动击穿（flaky）→ 放宽到 30s（仅此用例）
  it('模块可导入', async () => {
    const mod = await import('../AppShell')
    expect(mod.AppShell).toBeDefined()
  }, 30_000)
})
