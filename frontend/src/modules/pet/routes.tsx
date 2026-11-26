import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const PetPage = lazy(() => import('./components/PetPage'))

export const petRoutes: RouteObject[] = [
  {
    path: 'pet',
    element: <PetPage />,
  },
]
