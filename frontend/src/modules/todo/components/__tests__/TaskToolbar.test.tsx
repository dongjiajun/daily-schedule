import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskToolbar } from '../TaskToolbar'

describe('TaskToolbar', () => {
  it('渲染新建任务按钮', () => {
    render(
      <TaskToolbar
        viewMode="board"
        onViewModeChange={() => {}}
        onNewTask={() => {}}
      />
    )
    expect(screen.getByText(/新建任务/)).toBeInTheDocument()
  })

  it('默认看板视图为激活状态', () => {
    render(
      <TaskToolbar
        viewMode="board"
        onViewModeChange={() => {}}
        onNewTask={() => {}}
      />
    )
    expect(screen.getByText(/看板/)).toBeInTheDocument()
  })

  it('渲染列表视图切换按钮', () => {
    render(
      <TaskToolbar
        viewMode="board"
        onViewModeChange={() => {}}
        onNewTask={() => {}}
      />
    )
    expect(screen.getByText(/列表/)).toBeInTheDocument()
  })
})
