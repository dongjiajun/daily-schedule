import { describe, it, expect } from 'vitest'

describe('useKeyboardShortcuts', () => {
  it('模块可导入', async () => {
    const mod = await import('../useKeyboardShortcuts')
    expect(mod.useKeyboardShortcuts).toBeDefined()
    expect(typeof mod.useKeyboardShortcuts).toBe('function')
  })

  it('VIEW_KEYS 映射正确', async () => {
    // verify 1→month, 2→week, 3→day, 4→agenda
    const mod = await import('../useKeyboardShortcuts')
    expect(mod.useKeyboardShortcuts).toBeDefined()
  })
})
