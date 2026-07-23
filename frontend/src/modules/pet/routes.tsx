import PetPage from './components/PetPage'
import type { RouteObject } from 'react-router-dom'

export const petRoutes: RouteObject[] = [
  {
    path: 'pet',
    element: <PetPage />,
  },
]
