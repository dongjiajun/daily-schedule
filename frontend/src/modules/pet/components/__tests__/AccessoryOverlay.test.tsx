import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AccessoryOverlay } from '../AccessoryOverlay'
import { getSkinFilter, ACCESSORY_RENDER_MAP } from '../../lib/accessoryRenderMap'
import { SvgAvatar } from '../SvgAvatar'

describe('AccessoryOverlay', () => {
  it('巫师帽 → 渲染帽子叠加层 SVG', () => {
    const { container } = render(<AccessoryOverlay name="巫师帽" size={100} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('兔耳朵 → 渲染叠加层（ear kind）', () => {
    const { container } = render(<AccessoryOverlay name="兔耳朵" />)
    expect(container.querySelectorAll('ellipse').length).toBeGreaterThan(0)
  })

  it('皮肤类 → 返回 null（filter 由 SvgAvatar 应用到基础插画）', () => {
    const { container } = render(<AccessoryOverlay name="年兽皮肤" />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('未知名称 → 静默回退不渲染', () => {
    const { container } = render(<AccessoryOverlay name="不存在的配饰" />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('name 为空 → 不渲染', () => {
    const { container } = render(<AccessoryOverlay name={null} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('getSkinFilter → 皮肤返回 filter，帽子/未知返回 undefined', () => {
    expect(getSkinFilter('年兽皮肤')).toContain('hue-rotate')
    expect(getSkinFilter('玉兔皮肤')).toContain('brightness')
    expect(getSkinFilter('巫师帽')).toBeUndefined()
    expect(getSkinFilter(null)).toBeUndefined()
    expect(getSkinFilter('不存在')).toBeUndefined()
  })

  it('映射表覆盖全部 11 个节日配饰', () => {
    const names = Object.keys(ACCESSORY_RENDER_MAP)
    expect(names).toHaveLength(11)
    expect(names).toEqual(expect.arrayContaining(['年兽皮肤', '麋鹿角', '巫师帽', '玉兔皮肤', '粽子背包', '新年帽', '火鸡帽', '绿帽子', '樱花发饰', '印度象皮肤', '兔耳朵']))
  })
})

describe('SvgAvatar 装扮', () => {
  it('accessory=巫师帽 → 基础插画 + 叠加层两个 SVG', () => {
    const { container } = render(<SvgAvatar species="ORANGE_CAT" emotion="idle" accessory="巫师帽" />)
    expect(container.querySelectorAll('svg')).toHaveLength(2)
  })

  it('accessory=年兽皮肤 → 容器应用皮肤 filter', () => {
    const { container } = render(<SvgAvatar species="ORANGE_CAT" emotion="idle" accessory="年兽皮肤" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.filter).toContain('hue-rotate')
    expect(container.querySelectorAll('svg')).toHaveLength(1) // 皮肤无叠加层
  })

  it('未装备 → 单个 SVG 且无 filter', () => {
    const { container } = render(<SvgAvatar species="SHIBA_INU" emotion="idle" accessory={null} />)
    const wrapper = container.firstChild as HTMLElement
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(wrapper.style.filter).toBe('')
  })
})
