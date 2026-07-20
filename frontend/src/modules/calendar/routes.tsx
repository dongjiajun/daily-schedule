import type { RouteObject } from 'react-router-dom'

export const calendarRoutes: RouteObject[] = [
  {
    index: true,
    lazy: () => import('./components/HomePage').then((m) => ({ Component: m.HomePage })),
  },
]
