import { describe, it, expect } from 'vitest'

describe('EventForm', () => {
  it('模块可导入', async () => {
    const mod = await import('../EventForm')
    expect(mod.EventForm).toBeDefined()
    expect(typeof mod.EventForm).toBe('function')
  })
})
