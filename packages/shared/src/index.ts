export type { EventStatus, EventBase, SystemEvent, CalendarEvent, TaskEvent, HabitEvent, FocusEvent, UserEvent } from './types'
export { PRESET_COLORS, API_BASE, AUTH_ENDPOINTS, ENDPOINTS } from './constants'
export { EventBus } from './eventBus'
// holiday 模块不在此处 barrel export。
// HolidayEngine 依赖 lunar-typescript，浏览器 ESM 会级联加载所有 re-export，
// 即使 import { EventBus } 也会被迫解析 lunar-typescript。
// M1.4 消费时通过单独 entry point 导入：import { holidayEngine } from '@daily-schedule/shared/holiday'
