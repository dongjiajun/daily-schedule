import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('pages/pet/index.config', () => {
  beforeEach(() => {
    vi.resetModules()
    ;(globalThis as Record<string, unknown>).definePageConfig = (config: unknown) => config
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).definePageConfig
  })

  it('声明宠物页导航栏标题为「宠物」', async () => {
    const mod = await import('../pages/pet/index.config')
    expect(mod.default).toEqual({ navigationBarTitleText: '宠物' })
  })
})
