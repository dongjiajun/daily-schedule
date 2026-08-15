import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from '../TaskCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import React from 'react'

vi.mock('@/api/sdk.gen', () => ({
  deleteTask: vi.fn().mockResolvedValue({ response: { ok: true } }),
  createTask: vi.fn().mockResolvedValue({
    data: { id: 2, title: '买水果', status: 'TODO', priority: 'HIGH', sortOrder: 1 },
    response: { ok: true },
  }),
  moveTask: vi.fn().mockResolvedValue({ data: { id: 2, status: 'DONE' }, response: { ok: true } }),
}))

import { deleteTask, createTask } from '@/api/sdk.gen'

// jsdom 未实现 PointerCapture，sonner toast 的 onPointerDown 需要（见 vitest 环境限制）
beforeAll(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

const mockTask = {
  id: 1,
  title: '买水果',
  status: 'TODO' as const,
  priority: 'HIGH' as const,
  sortOrder: 1,
  dueDate: null,
  description: null,
  tags: [],
  userId: 1,
  createdAt: '',
  updatedAt: '',
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

function wrapperWithToaster({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return React.createElement(
    QueryClientProvider,
    { client: qc },
    children,
    React.createElement(Toaster)
  )
}

describe('TaskCard', () => {
  it('渲染任务标题', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('买水果')).toBeInTheDocument()
  })

  it('渲染优先级标签', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('编辑/删除按钮常驻可见（无需 hover）', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    const editBtn = screen.getByRole('button', { name: /编辑/ })
    const deleteBtn = screen.getByRole('button', { name: /删除/ })
    expect(editBtn).toBeVisible()
    expect(deleteBtn).toBeVisible()
  })

  it('渲染状态下拉（combobox）', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('删除走 sonner 撤销：无 confirm，删除后可撤销重建', async () => {
    const user = userEvent.setup()
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper: wrapperWithToaster })

    await user.click(screen.getByRole('button', { name: /删除/ }))

    // 无原生 confirm（若有会阻塞测试），直接出现撤销 toast
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(expect.objectContaining({ path: { id: 1 } })))
    await waitFor(() => expect(screen.getByText('任务已删除')).toBeInTheDocument())
    const undoBtn = screen.getByRole('button', { name: /撤销/ })
    expect(undoBtn).toBeInTheDocument()

    await user.click(undoBtn)

    await waitFor(() => expect(createTask).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('已撤销删除')).toBeInTheDocument())
  })
})
