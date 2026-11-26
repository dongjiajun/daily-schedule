import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const TodoPage = lazy(() => import('./components/TodoPage'))

export const todoRoutes: RouteObject[] = [
  {
    path: 'todo',
    element: <TodoPage />,
  },
]
