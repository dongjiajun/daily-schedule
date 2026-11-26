import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { EffectLayer } from '../EffectLayer'
import { useSettingsStore } from '@/core/store/settingsStore'

let shouldThrowParticle = false

// Mock tsParticles to avoid WASM initialization
vi.mock('@tsparticles/react', () => ({
  default: ({ id }: { id: string }) => {
    if (shouldThrowParticle) {
      throw new Error('Particle init failed')
    }
    return <div data-testid={id} />
  },
}))

// Mock window APIs not available in jsdom
beforeEach(() => {
  shouldThrowParticle = false
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

  it('prefers-reduced-motion=reduce 时禁用并跳过粒子渲染', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    useSettingsStore.setState({ activeHolidayId: 'spring-festival' })
    const { container } = render(<EffectLayer />)
    expect(container.innerHTML).toBe('')
  })

  it('春节异步激活烟花特效', async () => {
    useSettingsStore.setState({ activeHolidayId: 'spring-festival' })
    const { findByTestId } = render(<EffectLayer />)
    expect(await findByTestId('firework-particles')).toBeInTheDocument()
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

  it('中秋节异步激活灯笼特效', async () => {
    useSettingsStore.setState({ activeHolidayId: 'mid-autumn' })
    const { findByTestId } = render(<EffectLayer />)
    expect(await findByTestId('lantern-particles')).toBeInTheDocument()
  })

  it('情人节激活爱心特效', () => {
    useSettingsStore.setState({ activeHolidayId: 'valentines' })
    const { container } = render(<EffectLayer />)
    expect(container.textContent).toContain('💖')
  })

  it('感恩节激活落叶特效', () => {
    useSettingsStore.setState({ activeHolidayId: 'thanksgiving' })
    const { container } = render(<EffectLayer />)
    expect(container.textContent).toContain('🍂')
  })

  it('effectType=none 时不渲染特效', () => {
    useSettingsStore.setState({ activeHolidayId: 'dragon-boat' })
    const { container } = render(<EffectLayer />)
    // 只有空的 wrapper div，没有实际特效内容
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.children.length).toBe(0)
  })

  it('粒子特效渲染异常时静默降级不崩溃', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    shouldThrowParticle = true
    useSettingsStore.setState({ activeHolidayId: 'spring-festival' })

    const { container, queryByTestId, rerender } = render(<EffectLayer />)
    await new Promise((r) => setTimeout(r, 20))
    expect(queryByTestId('firework-particles')).not.toBeInTheDocument()
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.children.length).toBe(0)

    // 切换节日重置错误边界后可恢复
    shouldThrowParticle = false
    useSettingsStore.setState({ activeHolidayId: 'mid-autumn' })
    rerender(<EffectLayer />)
    await new Promise((r) => setTimeout(r, 20))
    expect(queryByTestId('lantern-particles')).toBeInTheDocument()
    errSpy.mockRestore()
  })
})
