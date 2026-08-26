import { apiRequest } from './api'

/**
 * 任务数据层（小程序任务列表）。
 *
 * 复用后端 `/tasks` 五端点中的四个（list/create/move/delete），消费 TaskProfile
 * 字段子集（TaskSummary），响应做字段校验（纯函数可单测）。
 * 日期处理沿用日历字符串切片方案：dueDate 为 `YYYY-MM-DD`（无时区），
 * 展示/判定用字典序比较（iOS JSC 安全），不对日期串 `new Date()`。
 */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TaskTag {
  id: number
  name: string
  color?: string
}

export interface TaskSummary {
  id: number
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority
  /** 组内排序权（升序；缺失视为最大，即组尾） */
  sortOrder?: number
  /** 截止日期（YYYY-MM-DD，字符串处理不解析） */
  dueDate?: string
  tags: TaskTag[]
}

/** 分组展示顺序（恒定三组） */
export const STATUS_ORDER: readonly TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
}

/** 优先级展示元数据（label + 区分色） */
export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  URGENT: { label: '紧急', color: '#f5222d' },
  HIGH: { label: '高', color: '#fa8c16' },
  MEDIUM: { label: '中', color: '#4f7cff' },
  LOW: { label: '低', color: '#8c8c8c' },
}

const TASK_STATUSES: readonly string[] = STATUS_ORDER
const TASK_PRIORITIES: readonly string[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

/** 校验并规范化单个标签（失败抛「任务数据格式异常」） */
function parseTaskTag(raw: unknown): TaskTag {
  // null/undefined 输入归 {} 后由必填校验抛错（语义等价，消除 TS 未收窄告警）
  const p = (raw ?? {}) as Record<string, unknown>
  const id = p.id
  const name = p.name
  if (typeof id !== 'number' || typeof name !== 'string' || name === '') {
    throw new Error('任务数据格式异常')
  }
  const tag: TaskTag = { id, name }
  if (typeof p.color === 'string') tag.color = p.color
  return tag
}

/** 校验并规范化单个任务（失败抛「任务数据格式异常」） */
export function parseTaskSummary(raw: unknown): TaskSummary {
  const p = (raw ?? {}) as Record<string, unknown>
  const id = p.id
  const title = p.title
  const status = p.status
  if (typeof id !== 'number'
      || typeof title !== 'string' || title === ''
      || typeof status !== 'string' || !TASK_STATUSES.includes(status)) {
    throw new Error('任务数据格式异常')
  }
  // 可选字段存在性判定：null 与 undefined 等价（后端 Jackson 默认序列化 null，
  // 无优先级/截止日期/排序的任务返回 `"priority": null` 等——2026-08-24 实测）
  if (p.priority != null
      && (typeof p.priority !== 'string' || !TASK_PRIORITIES.includes(p.priority))) {
    throw new Error('任务数据格式异常')
  }
  if (p.sortOrder != null && typeof p.sortOrder !== 'number') {
    throw new Error('任务数据格式异常')
  }
  if (p.dueDate != null && typeof p.dueDate !== 'string') {
    throw new Error('任务数据格式异常')
  }
  if (p.tags != null && !Array.isArray(p.tags)) {
    throw new Error('任务数据格式异常')
  }
  const summary: TaskSummary = { id, title, status: status as TaskStatus, tags: [] }
  if (typeof p.description === 'string') summary.description = p.description
  if (p.priority != null) summary.priority = p.priority as TaskPriority
  if (typeof p.sortOrder === 'number') summary.sortOrder = p.sortOrder
  if (typeof p.dueDate === 'string' && p.dueDate !== '') summary.dueDate = p.dueDate
  if (Array.isArray(p.tags)) summary.tags = p.tags.map(parseTaskTag)
  return summary
}

/**
 * 按状态分组（恒定三组：待办/进行中/已完成，空组保留空数组）。
 * 组内按 sortOrder 升序；缺失 sortOrder 视为最大（组尾）。
 */
export function groupTasksByStatus(tasks: TaskSummary[]): Map<TaskStatus, TaskSummary[]> {
  const map = new Map<TaskStatus, TaskSummary[]>()
  for (const status of STATUS_ORDER) {
    map.set(status, [])
  }
  const sorted = [...tasks].sort((a, b) => (
    (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
  ))
  for (const task of sorted) {
    map.get(task.status)?.push(task)
  }
  return map
}

/** 拉取全部任务（无过滤参数，服务端按用户隔离） */
export async function fetchTasks(): Promise<TaskSummary[]> {
  const data = await apiRequest<unknown>('/tasks')
  if (!Array.isArray(data)) {
    throw new Error('任务数据格式异常')
  }
  return data.map(parseTaskSummary)
}

/** 创建任务（title 必填；tagIds 不传——标签选择不在本变更范围） */
export async function createTask(input: {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
}): Promise<TaskSummary> {
  return parseTaskSummary(await apiRequest<unknown>('/tasks', { method: 'POST', data: input }))
}

/** 移动任务到新状态（sortOrder 传当前值，由服务端定序） */
export async function moveTask(id: number, status: TaskStatus, sortOrder?: number): Promise<TaskSummary> {
  return parseTaskSummary(await apiRequest<unknown>(`/tasks/${id}/move`, {
    method: 'PATCH',
    data: { status, sortOrder },
  }))
}

/** 删除任务（204 无响应体） */
export async function deleteTask(id: number): Promise<void> {
  await apiRequest<unknown>(`/tasks/${id}`, { method: 'DELETE' })
}
