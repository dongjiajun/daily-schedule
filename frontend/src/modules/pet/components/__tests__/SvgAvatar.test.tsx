import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { SvgAvatar } from '../SvgAvatar'
import { ANIMATION_CSS } from '../../assets/svg/animations'

describe('SvgAvatar', () => {
  it('renders orange cat by default', () => {
    const { container } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="idle" size={100} />
    )
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('橘猫 — idle')
  })

  it('renders shiba inu', () => {
    const { container } = render(
      <SvgAvatar species="SHIBA_INU" emotion="happy" size={100} />
    )
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('柴犬 — happy')
  })

  it('renders different emotions', () => {
    const emotions = ['idle', 'happy', 'sad', 'hungry', 'sleepy', 'excited', 'surprised', 'idle_variant'] as const
    for (const emotion of emotions) {
      const { container } = render(
        <SvgAvatar species="ORANGE_CAT" emotion={emotion} size={100} />
      )
      expect(container.querySelector('svg')).toBeTruthy()
    }
  })

  it('renders at custom size', () => {
    const { container } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="idle" size={50} />
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('50')
    expect(svg?.getAttribute('height')).toBe('50')
  })

  it('action 驱动 data-action 属性（动画层：连续动作 + eat + 小动作）', () => {
    const actions = ['idle', 'walk', 'pace', 'rest', 'sleep', 'jump', 'eat', 'stretch', 'yawn', 'scratch', 'look'] as const
    for (const action of actions) {
      const { container } = render(
        <SvgAvatar species="ORANGE_CAT" emotion="idle" action={action} size={100} />
      )
      expect(container.querySelector('svg')?.getAttribute('data-action')).toBe(action)
    }
  })

  it('eat 动作渲染嘴部咀嚼元素（pet-mouth class）', () => {
    const { container } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="happy" action="eat" size={100} />
    )
    expect(container.querySelectorAll('.pet-mouth').length).toBeGreaterThan(0)
  })

  it('sleep 动作渲染 Zzz 气泡元素', () => {
    const { container } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="sleepy" action="sleep" size={100} />
    )
    const bubbles = container.querySelectorAll('.pet-sleep-bubble')
    expect(bubbles.length).toBeGreaterThan(0)
  })

  it('idle 动作不渲染 Zzz 气泡', () => {
    const { container } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="idle" action="idle" size={100} />
    )
    expect(container.querySelectorAll('.pet-sleep-bubble').length).toBe(0)
  })

  it('情绪切换经眨眼过渡（data-blink 闭眼 → 换脸 → 50ms 后睁开）', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="idle" size={100} />
    )
    const svg = () => container.querySelector('svg')!
    expect(svg().getAttribute('data-blink')).toBe('0')

    // 情绪变化 → 两帧后闭眼（data-blink=1）且表情参数已切换
    rerender(<SvgAvatar species="ORANGE_CAT" emotion="happy" size={100} />)
    act(() => {
      // jsdom rAF 底层是 ~16ms setTimeout：推进 40ms 触发两层帧回调 → 换脸
      vi.advanceTimersByTime(40)
    })
    expect(svg().getAttribute('data-blink')).toBe('1')
    expect(svg().getAttribute('aria-label')).toBe('橘猫 — happy')

    // 50ms 眨眼结束 → 睁开（data-blink=0）
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(svg().getAttribute('data-blink')).toBe('0')
    vi.useRealTimers()
  })

  it('情绪未变化不触发眨眼', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(
      <SvgAvatar species="ORANGE_CAT" emotion="idle" size={100} />
    )
    rerender(<SvgAvatar species="ORANGE_CAT" emotion="idle" size={80} />)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(container.querySelector('svg')?.getAttribute('data-blink')).toBe('0')
    vi.useRealTimers()
  })

  it('动画层 keyframes 契约：eat/小动作/眨眼过渡/前倾均已定义', () => {
    // eat：低头 8° 咀嚼 + 尾巴快摆
    expect(ANIMATION_CSS).toContain('pet-eat')
    expect(ANIMATION_CSS).toContain('rotate(8deg)')
    expect(ANIMATION_CSS).toContain('pet-chew')
    expect(ANIMATION_CSS).toContain('pet-tail-fast')
    // 小动作：stretch/yawn/scratch/look，播放一次（iteration-count 1 + forwards）
    for (const key of ['pet-stretch', 'pet-yawn', 'pet-scratch', 'pet-look']) {
      expect(ANIMATION_CSS).toContain(key)
    }
    // 4 个小动作 keyframes 组（yawn 拆 body/eyes/mouth 三个 keyframes，按前缀归属）
    for (const prefix of ['pet-stretch', 'pet-yawn', 'pet-scratch', 'pet-look']) {
      expect(ANIMATION_CSS).toMatch(new RegExp(`@keyframes ${prefix}([\\s{]|-)`))
    }
    // 情绪眨眼过渡：data-blink 驱动 50ms
    expect(ANIMATION_CSS).toContain('pet-blink-now')
    expect(ANIMATION_CSS).toContain('[data-blink="1"] .pet-eyes')
    // walk 前倾 5°（均值 -5°：-7°~-3° 摆动）
    expect(ANIMATION_CSS).toContain('rotate(-7deg)')
    expect(ANIMATION_CSS).toContain('rotate(-3deg)')
  })
})
