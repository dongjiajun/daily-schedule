import { Cat } from 'lucide-react'
import type { ModuleDefinition } from '@/core/lib/moduleRegistry'
import { petRoutes } from './routes'
import { registerPetEventListeners, unregisterPetEventListeners } from './lib/petEventBridge'
import { RoamingPet } from './components/RoamingPet'
import { SidebarPet } from './components/SidebarPet'

export const petModule: ModuleDefinition = {
  id: 'pet',
  name: '宠物',
  description: '虚拟宠物养成，陪伴你的每一天',
  icon: Cat,
  order: 2,
  routes: petRoutes,
  globalOverlayComponent: RoamingPet,
  sidebarFooterComponent: SidebarPet,
  onInit: () => {
    registerPetEventListeners()
  },
  onDestroy: () => {
    unregisterPetEventListeners()
  },
}
