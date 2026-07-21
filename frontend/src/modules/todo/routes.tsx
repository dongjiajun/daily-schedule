import type { RouteObject } from 'react-router-dom'

export const todoRoutes: RouteObject[] = [
  {
    path: 'todo',
    lazy: () => import('./components/TodoPage').then((m) => ({ Component: m.default })),
  },
]
