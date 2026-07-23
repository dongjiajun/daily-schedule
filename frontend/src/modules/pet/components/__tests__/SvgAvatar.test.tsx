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
})
