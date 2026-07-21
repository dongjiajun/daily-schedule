import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { EffectLayer } from '../EffectLayer'
import { useSettingsStore } from '@/core/store/settingsStore'

// Mock tsParticles to avoid WASM initialization
vi.mock('@tsparticles/react', () => ({
  default: ({ id }: { id: string }) => <div data-testid={id} />,
}))

// Mock window APIs not available in jsdom
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
})

describe('EffectLayer', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      effectIntensity: 'low',
      activeHolidayId: null,
    })
  })

  it('无活跃节日时不渲染', () => {
    const { container } = render(<EffectLayer />)
    expect(container.innerHTML).toBe('')
  })

  it('effectIntensity=off 时不渲染', () => {
    useSettingsStore.setState({
      effectIntensity: 'off',
      activeHolidayId: 'spring-festival',
    })
    const { container } = render(<EffectLayer />)
    expect(container.innerHTML).toBe('')
  })

  it('春节激活烟花特效', () => {
    useSettingsStore.setState({ activeHolidayId: 'spring-festival' })
    const { getByTestId } = render(<EffectLayer />)
    expect(getByTestId('firework-particles')).toBeInTheDocument()
  })

  it('圣诞节激活雪花特效', () => {
    useSettingsStore.setState({ activeHolidayId: 'christmas' })
    const { container } = render(<EffectLayer />)
    // Snowfall renders ❄ characters
    expect(container.textContent).toContain('❄')
  })

  it('樱花季激活花瓣', () => {
    useSettingsStore.setState({ activeHolidayId: 'sakura' })
    const { container } = render(<EffectLayer />)
    expect(container.textContent).toContain('🌸')
  })

  it('中秋节激活灯笼', () => {
    useSettingsStore.setState({ activeHolidayId: 'mid-autumn' })
    const { getByTestId } = render(<EffectLayer />)
    expect(getByTestId('lantern-particles')).toBeInTheDocument()
  })

  it('effectType=none 时不渲染特效', () => {
    useSettingsStore.setState({ activeHolidayId: 'dragon-boat' })
    const { container } = render(<EffectLayer />)
    // 只有空的 wrapper div，没有实际特效内容
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.children.length).toBe(0)
  })
})
