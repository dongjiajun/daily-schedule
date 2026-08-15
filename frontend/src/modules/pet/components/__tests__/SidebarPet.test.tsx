import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { getZones } from '../../lib/zoneRegistry'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div data-mock-motion {...props}>{children}</div>
    ),
  },
}))

vi.mock('../../hooks/usePet', () => ({
  useMyPet: () => ({
    data: { id: 1, name: '豆豆', species: 'ORANGE_CAT', mood: 80, hunger: 60, coins: 10, level: 2 },
    isLoading: false,
  }),
  useEquippedAccessoryName: () => null,
}))

import { SidebarPet } from '../SidebarPet'

const HOME_ZONE_ID = 'pet-home-spot'

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SidebarPet', () => {
  it('模块可导入', async () => {
    const mod = await import('../SidebarPet')
    expect(mod.SidebarPet).toBeDefined()
    expect(typeof mod.SidebarPet).toBe('function')
  })

  it('宠物存在时注册 pet-spot Zone（小窝），卸载时注销', () => {
    const { unmount } = render(<SidebarPet />)

    const zone = getZones().find((z) => z.id === HOME_ZONE_ID)
    expect(zone).toBeDefined()
    expect(zone!.type).toBe('pet-spot')
    expect(zone!.weight).toBe(1)
    // 无 decayTime：小窝常驻（非衰减兴趣点）
    expect(zone!.decayTime).toBeUndefined()

    unmount()
    expect(getZones().find((z) => z.id === HOME_ZONE_ID)).toBeUndefined()
  })

  it('scroll/resize 事件驱动小窝 rect 更新', () => {
    const original = Element.prototype.getBoundingClientRect
    const rects = [
      { left: 10, top: 20, right: 200, bottom: 150 },
      { left: 30, top: 40, right: 220, bottom: 170 },
    ]
    let i = 0
    Element.prototype.getBoundingClientRect = () => ({
      ...rects[i],
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    try {
      render(<SidebarPet />)
      expect(getZones().find((z) => z.id === HOME_ZONE_ID)!.rect).toMatchObject(rects[0])

      i = 1
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })
      expect(getZones().find((z) => z.id === HOME_ZONE_ID)!.rect).toMatchObject(rects[1])

      i = 0
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
      expect(getZones().find((z) => z.id === HOME_ZONE_ID)!.rect).toMatchObject(rects[0])
    } finally {
      Element.prototype.getBoundingClientRect = original
    }
  })
})
