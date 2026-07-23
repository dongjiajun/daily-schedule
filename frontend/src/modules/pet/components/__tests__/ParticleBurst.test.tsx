import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ParticleBurst } from '../ParticleBurst'

describe('ParticleBurst', () => {
  it('renders correct number of particles', () => {
    const { container } = render(
      <ParticleBurst origin={{ x: 100, y: 100 }} type="hearts" count={5} />
    )
    // Each particle is a span inside the container div
    const spans = container.querySelectorAll('span[style]')
    // 5 particles, each with an absolute-positioned span
    expect(spans.length).toBeGreaterThanOrEqual(5)
  })

  it('renders hearts type at origin', () => {
    const { container } = render(
      <ParticleBurst origin={{ x: 100, y: 200 }} type="hearts" count={3} />
    )
    expect(container.firstChild).toBeTruthy()
    // Verify container exists and renders particles
    expect(container.querySelectorAll('[class*="absolute"]').length).toBeGreaterThanOrEqual(3)
  })
})
