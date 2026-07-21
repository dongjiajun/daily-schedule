import { HomePage } from './components/HomePage'
import type { RouteObject } from 'react-router-dom'

export const calendarRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
]
