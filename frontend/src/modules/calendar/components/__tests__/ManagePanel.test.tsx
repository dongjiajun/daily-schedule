import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api/sdk.gen', () => ({
  listCategories: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  listTags: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  createCategory: vi.fn(),
  createTag: vi.fn(),
  deleteCategory: vi.fn(),
  deleteTag: vi.fn(),
  updateCategory: vi.fn(),
  updateTag: vi.fn(),
}))

describe('ManagePanel', () => {
  it('模块可导入', async () => {
    const mod = await import('../ManagePanel')
    expect(mod.ManagePanel).toBeDefined()
  })
})
