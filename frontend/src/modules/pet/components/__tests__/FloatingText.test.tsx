import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FloatingText } from '../FloatingText'

describe('FloatingText', () => {
  it('渲染多条浮动数值', () => {
    render(
      <FloatingText
        origin={{ x: 100, y: 200 }}
        items={[
          { text: '+20 饱腹', tone: 'good' },
          { text: '-10 金币', tone: 'bad' },
        ]}
      />
    )
    expect(screen.getByText('+20 饱腹')).toBeInTheDocument()
    expect(screen.getByText('-10 金币')).toBeInTheDocument()
  })

  it('items 为空时不渲染', () => {
    const { container } = render(<FloatingText origin={{ x: 0, y: 0 }} items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
