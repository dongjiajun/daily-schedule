/**
 * 日程状态。PLANNED=计划中，COMPLETED=已完成，CANCELLED=已取消。
 * 与后端 OpenAPI schema 定义同步。
 */
export type EventStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED'

/** 日程基础字段（Web + 小程序共享） */
export interface EventBase {
  id?: number
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  location?: string
  color?: string
  status?: EventStatus
  categoryId?: number
  categoryName?: string
  categoryColor?: string
  createdAt?: string
  updatedAt?: string
}
