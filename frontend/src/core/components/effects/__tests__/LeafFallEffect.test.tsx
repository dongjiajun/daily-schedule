import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LeafFallEffect } from '../LeafFallEffect'

const LEAF_EMOJIS = '🍂🍁🌿🍃'

/** 统计 textContent 中落叶 emoji 数量（spread 按码点拆分，避免代理对拆半） */
function countLeaves(container: HTMLElement): number {
  return [...container.textContent ?? ''].filter((c) => LEAF_EMOJIS.includes(c)).length
}

describe('LeafFallEffect', () => {
  it('low 模式渲染 20 片落叶', () => {
    const { container } = render(<LeafFallEffect intensity="low" />)
    expect(countLeaves(container)).toBe(20)
  })

  it('full 模式渲染 40 片落叶', () => {
    const { container } = render(<LeafFallEffect intensity="full" />)
    expect(countLeaves(container)).toBe(40)
  })
})
