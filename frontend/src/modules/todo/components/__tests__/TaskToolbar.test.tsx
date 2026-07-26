import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskToolbar } from '../TaskToolbar'
import { useTodoStore } from '../../store/todoStore'

describe('TaskToolbar', () => {
  it('渲染新建任务按钮', () => {
    render(<TaskToolbar onOpenCreate={() => {}} />)
    expect(screen.getByText(/新建任务/)).toBeInTheDocument()
  })

  it('默认看板视图为激活状态', () => {
    useTodoStore.setState({ viewMode: 'board' })
    render(<TaskToolbar onOpenCreate={() => {}} />)
    expect(screen.getByText(/看板/)).toBeInTheDocument()
  })
})
