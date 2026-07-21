import { Kanban } from 'lucide-react'
import type { ModuleDefinition } from '@/core/lib/moduleRegistry'
import { todoRoutes } from './routes'

export const todoModule: ModuleDefinition = {
  id: 'todo',
  name: '任务看板',
  description: '看板式任务管理，拖拽换列，宠物联动',
  icon: Kanban,
  order: 20,
  routes: todoRoutes,
  petActions: [
    { eventType: 'task:completed', description: '完成任务 → 宠物开心 + 专注币' },
    { eventType: 'task:created', description: '创建任务 → 宠物鼓励' },
  ],
}
