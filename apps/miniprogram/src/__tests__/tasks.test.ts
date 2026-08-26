import { beforeEach, describe, expect, it, vi } from 'vitest'

// tasks.ts 依赖的请求层整体 mock（单测只验证数据层自身的解析/分组/错误语义）
vi.mock('../lib/api', () => ({
  apiRequest: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}))

import { apiRequest } from '../lib/api'
import {
  createTask, deleteTask, fetchTasks, groupTasksByStatus, moveTask, parseTaskSummary,
} from '../lib/tasks'

const apiRequestMock = vi.mocked(apiRequest)

const VALID_TASK = {
  id: 1,
  title: '写周报',
  description: '总结本周进展',
  status: 'TODO',
  priority: 'HIGH',
  sortOrder: 3,
  dueDate: '2026-08-25',
  tags: [{ id: 2, name: '工作', color: '#4f7cff' }],
  createdAt: '2026-08-22T09:00:00',
  updatedAt: '2026-08-22T09:00:00',
}

describe('parseTaskSummary', () => {
  it('完整字段 → 规范化 TaskSummary', () => {
    expect(parseTaskSummary(VALID_TASK)).toEqual({
      id: 1,
      title: '写周报',
      description: '总结本周进展',
      status: 'TODO',
      priority: 'HIGH',
      sortOrder: 3,
      dueDate: '2026-08-25',
      tags: [{ id: 2, name: '工作', color: '#4f7cff' }],
    })
  })

  it('可选字段缺失 → 归一（tags 默认空数组）', () => {
    const summary = parseTaskSummary({ id: 1, title: '只有必填', status: 'DONE' })
    expect(summary.description).toBeUndefined()
    expect(summary.priority).toBeUndefined()
    expect(summary.sortOrder).toBeUndefined()
    expect(summary.dueDate).toBeUndefined()
    expect(summary.tags).toEqual([])
  })

  it('缺 title → 抛「任务数据格式异常」', () => {
    expect(() => parseTaskSummary({ id: 1, status: 'TODO' })).toThrow('任务数据格式异常')
  })

  it('status 非法值 → 抛异常', () => {
    expect(() => parseTaskSummary({ id: 1, title: 'x', status: 'PENDING' })).toThrow('任务数据格式异常')
  })

  it('可选字段为 null（后端 Jackson 默认序列化）→ 视为缺省不抛', () => {
    const summary = parseTaskSummary({
      id: 1, title: '无优先级任务', status: 'TODO',
      priority: null, sortOrder: null, dueDate: null, tags: null,
    })
    expect(summary.priority).toBeUndefined()
    expect(summary.sortOrder).toBeUndefined()
    expect(summary.dueDate).toBeUndefined()
    expect(summary.tags).toEqual([])
  })

  it('priority 非枚举 → 抛异常', () => {
    expect(() => parseTaskSummary({ id: 1, title: 'x', status: 'TODO', priority: 'URGENT2' }))
      .toThrow('任务数据格式异常')
  })

  it('tags 为数组但元素非法 → 抛异常', () => {
    expect(() => parseTaskSummary({ id: 1, title: 'x', status: 'TODO', tags: [{ id: 'a', name: 1 }] }))
      .toThrow('任务数据格式异常')
  })

  it('tags 非数组 → 抛异常', () => {
    expect(() => parseTaskSummary({ id: 1, title: 'x', status: 'TODO', tags: 'x' }))
      .toThrow('任务数据格式异常')
  })

  it('sortOrder 非 number → 抛异常', () => {
    expect(() => parseTaskSummary({ id: 1, title: 'x', status: 'TODO', sortOrder: '3' }))
      .toThrow('任务数据格式异常')
  })
})

describe('groupTasksByStatus', () => {
  it('恒定三组（空组保留），组内 sortOrder 升序', () => {
    const grouped = groupTasksByStatus([
      { id: 1, title: '待办B', status: 'TODO', sortOrder: 5, tags: [] },
      { id: 2, title: '待办A', status: 'TODO', sortOrder: 1, tags: [] },
      { id: 3, title: '完成', status: 'DONE', sortOrder: 1, tags: [] },
      { id: 4, title: '进行', status: 'IN_PROGRESS', sortOrder: 1, tags: [] },
    ])
    expect([...grouped.keys()]).toEqual(['TODO', 'IN_PROGRESS', 'DONE'])
    expect(grouped.get('TODO')?.map(t => t.id)).toEqual([2, 1])
    expect(grouped.get('IN_PROGRESS')?.map(t => t.id)).toEqual([4])
    expect(grouped.get('DONE')?.map(t => t.id)).toEqual([3])
  })

  it('缺失 sortOrder → 视为组尾', () => {
    const grouped = groupTasksByStatus([
      { id: 1, title: '有序', status: 'TODO', sortOrder: 2, tags: [] },
      { id: 2, title: '无序', status: 'TODO', tags: [] },
    ])
    expect(grouped.get('TODO')?.map(t => t.id)).toEqual([1, 2])
  })

  it('空数组 → 三组各空', () => {
    const grouped = groupTasksByStatus([])
    expect([...grouped.values()]).toEqual([[], [], []])
  })
})

describe('任务 API 封装', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
  })

  it('fetchTasks → 合法数组解析返回 TaskSummary[]，请求路径 /tasks', async () => {
    apiRequestMock.mockResolvedValue([VALID_TASK])
    const list = await fetchTasks()
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('写周报')
    expect(apiRequestMock).toHaveBeenCalledWith('/tasks')
  })

  it('fetchTasks → 响应非数组抛「任务数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue({ tasks: [] })
    await expect(fetchTasks()).rejects.toThrow('任务数据格式异常')
  })

  it('fetchTasks → 数组内任务非法抛「任务数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue([{ id: 1, title: '无状态' }])
    await expect(fetchTasks()).rejects.toThrow('任务数据格式异常')
  })

  it('fetchTasks → 请求层错误原样上抛', async () => {
    apiRequestMock.mockRejectedValue(new Error('登录凭证无效或已过期'))
    await expect(fetchTasks()).rejects.toThrow('登录凭证无效或已过期')
  })

  it('createTask → POST /tasks 并携带请求体，响应解析', async () => {
    apiRequestMock.mockResolvedValue(VALID_TASK)
    const created = await createTask({ title: '写周报', priority: 'HIGH', dueDate: '2026-08-25' })
    expect(created.id).toBe(1)
    expect(apiRequestMock).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      data: { title: '写周报', priority: 'HIGH', dueDate: '2026-08-25' },
    })
  })

  it('createTask → title only 请求体最小化（description 不传空串）', async () => {
    apiRequestMock.mockResolvedValue({ id: 1, title: 'x', status: 'TODO', tags: [] })
    await createTask({ title: 'x' })
    expect(apiRequestMock).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      data: { title: 'x' },
    })
  })

  it('moveTask → PATCH /tasks/{id}/move 并携带 status + sortOrder', async () => {
    apiRequestMock.mockResolvedValue({ ...VALID_TASK, status: 'DONE' })
    const updated = await moveTask(1, 'DONE', 3)
    expect(updated.status).toBe('DONE')
    expect(apiRequestMock).toHaveBeenCalledWith('/tasks/1/move', {
      method: 'PATCH',
      data: { status: 'DONE', sortOrder: 3 },
    })
  })

  it('deleteTask → DELETE /tasks/{id}（204 无响应体）', async () => {
    apiRequestMock.mockResolvedValue(undefined)
    await deleteTask(1)
    expect(apiRequestMock).toHaveBeenCalledWith('/tasks/1', { method: 'DELETE' })
  })

  it('moveTask → 响应非法抛「任务数据格式异常」', async () => {
    apiRequestMock.mockResolvedValue({ id: 1, title: 'x' })
    await expect(moveTask(1, 'DONE', 3)).rejects.toThrow('任务数据格式异常')
  })
})
