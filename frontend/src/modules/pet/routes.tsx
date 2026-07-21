import type { RouteObject } from 'react-router-dom'

export const petRoutes: RouteObject[] = [
  {
    path: 'pet',
    lazy: () => import('./components/PetPage').then((m) => ({ Component: m.default })),
  },
]
