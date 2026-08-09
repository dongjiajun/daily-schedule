import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HeartFallEffect } from '../HeartFallEffect'

/** 统计 textContent 中爱心 emoji 数量（正则按完整序列匹配，❤️ 含变体选择符 FE0F，spread 拆分会算成 2 个） */
function countHearts(container: HTMLElement): number {
  return (container.textContent?.match(/💖|💕|❤️|💘/g) ?? []).length
}

describe('HeartFallEffect', () => {
  it('low 模式渲染 20 颗爱心', () => {
    const { container } = render(<HeartFallEffect intensity="low" />)
    expect(countHearts(container)).toBe(20)
  })

  it('full 模式渲染 40 颗爱心', () => {
    const { container } = render(<HeartFallEffect intensity="full" />)
    expect(countHearts(container)).toBe(40)
  })
})
