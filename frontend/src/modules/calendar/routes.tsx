import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const HomePage = lazy(() =>
  import('./components/HomePage').then((m) => ({ default: m.HomePage }))
)

export const calendarRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
]
