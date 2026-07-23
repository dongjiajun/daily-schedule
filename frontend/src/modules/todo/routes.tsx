import TodoPage from './components/TodoPage'
import type { RouteObject } from 'react-router-dom'

export const todoRoutes: RouteObject[] = [
  {
    path: 'todo',
    element: <TodoPage />,
  },
]
