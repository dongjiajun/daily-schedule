import { describe, it, expect } from 'vitest'
import type { ReactElement } from 'react'
import { calendarRoutes } from '@/modules/calendar/routes'
import { todoRoutes } from '@/modules/todo/routes'
import { petRoutes } from '@/modules/pet/routes'

const LAZY_SYMBOL = Symbol.for('react.lazy')

function assertLazyElement(element: unknown) {
  expect(element).toBeTruthy()
  const el = element as ReactElement & { type?: { $$typeof?: symbol } }
  expect(el.type?.$$typeof).toBe(LAZY_SYMBOL)
}

describe('module lazyRoutes', () => {
  it('calendarRoutes 保留 index 路由并采用 React.lazy 封装 HomePage', () => {
    expect(calendarRoutes).toHaveLength(1)
    expect(calendarRoutes[0].index).toBe(true)
    assertLazyElement(calendarRoutes[0].element)
  })

  it('todoRoutes 保留 path=todo 并采用 React.lazy 封装 TodoPage', () => {
    expect(todoRoutes).toHaveLength(1)
    expect(todoRoutes[0].path).toBe('todo')
    assertLazyElement(todoRoutes[0].element)
  })

  it('petRoutes 保留 path=pet 并采用 React.lazy 封装 PetPage', () => {
    expect(petRoutes).toHaveLength(1)
    expect(petRoutes[0].path).toBe('pet')
    assertLazyElement(petRoutes[0].element)
  })
})
