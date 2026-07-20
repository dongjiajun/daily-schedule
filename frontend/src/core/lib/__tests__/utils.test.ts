import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('合并 class 字符串', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('过滤 null 和 undefined', () => {
    expect(cn('text-sm', undefined, null, 'font-bold')).toBe('text-sm font-bold')
  })

  it('tailwind 冲突时后者覆盖前者', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('空输入返回空字符串', () => {
    expect(cn()).toBe('')
  })
})
