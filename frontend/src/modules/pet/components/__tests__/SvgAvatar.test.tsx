import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SvgAvatar } from '../SvgAvatar'

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

  it('action 驱动 data-action 属性（动画层）', () => {
    const actions = ['idle', 'walk', 'rest', 'sleep', 'jump'] as const
    for (const action of actions) {
      const { container } = render(
        <SvgAvatar species="ORANGE_CAT" emotion="idle" action={action} size={100} />
      )
      expect(container.querySelector('svg')?.getAttribute('data-action')).toBe(action)
    }
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
})
