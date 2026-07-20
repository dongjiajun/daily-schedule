import { CalendarDays } from 'lucide-react'
import type { ModuleDefinition } from '@/core/lib/moduleRegistry'
import { calendarRoutes } from './routes'
import { CalendarSidebar } from './components/CalendarSidebar'

export const calendarModule: ModuleDefinition = {
  id: 'calendar',
  name: '日程管理',
  description: '日历视图、事件管理、提醒、ICS 导出',
  icon: CalendarDays,
  order: 1,
  routes: calendarRoutes,
  sidebarComponent: CalendarSidebar,
  petActions: [
    {
      eventType: 'event:completed',
      description: '完成日程 → +专注币 +经验',
    },
    {
      eventType: 'event:created',
      description: '创建日程 → +少量经验',
    },
    {
      eventType: 'event:cancelled',
      description: '取消日程 → 宠物失落',
    },
  ],
}
