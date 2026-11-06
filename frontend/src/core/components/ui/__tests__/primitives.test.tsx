import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from '../card'
import { Badge } from '../badge'
import { Segmented } from '../segmented'
import { EmptyState } from '../empty-state'
import { Skeleton } from '../skeleton'
import { Tooltip } from '../tooltip'
import { Kbd } from '../kbd'
import { Progress } from '../progress'

describe('组件原语', () => {
  it('Card 使用密度内边距与卡片阴影 token', () => {
    render(<Card data-testid="card">内容</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveTextContent('内容')
    expect(card.className).toContain('--density-card-pad')
    expect(card.className).toContain('shadow-card')
  })

  it('Badge 按 tone 输出语义色', () => {
    render(
      <div>
        <Badge tone="success">完成</Badge>
        <Badge tone="error">失败</Badge>
      </div>
    )
    expect(screen.getByText('完成').className).toContain('text-success-fg')
    expect(screen.getByText('失败').className).toContain('text-error-fg')
  })

  it('Segmented 具备 radiogroup 语义并在点击时回调', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Segmented
        ariaLabel="选择视图"
        value="month"
        onChange={onChange}
        options={[
          { value: 'month', label: '月' },
          { value: 'week', label: '周' },
        ]}
      />
    )
    expect(screen.getByRole('radiogroup', { name: '选择视图' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '月' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: '周' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })

  it('Segmented 支持方向键切换', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Segmented
        ariaLabel="选择视图"
        value="month"
        onChange={onChange}
        options={[
          { value: 'month', label: '月' },
          { value: 'week', label: '周' },
        ]}
      />
    )
    screen.getByRole('radio', { name: '月' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('week')
  })

  it('EmptyState 渲染标题、说明与操作入口', () => {
    render(
      <EmptyState
        title="暂无日程"
        description="点击新建开始"
        action={<button type="button">新建</button>}
      />
    )
    expect(screen.getByText('暂无日程')).toBeInTheDocument()
    expect(screen.getByText('点击新建开始')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新建' })).toBeInTheDocument()
  })

  it('Skeleton 对辅助技术隐藏', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('Tooltip 通过 aria-describedby 关联目标并渲染文本', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="新建日程">
        <button type="button">+</button>
      </Tooltip>
    )
    const trigger = screen.getByRole('button', { name: '+' })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('新建日程')
    expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id)
    await user.hover(trigger)
    expect(tooltip).toBeInTheDocument()
  })

  it('Kbd 使用 kbd 语义', () => {
    render(<Kbd>N</Kbd>)
    expect(screen.getByText('N').tagName).toBe('KBD')
  })

  it('Progress 提供进度语义并对越界值收敛', () => {
    render(<Progress value={140} label="完成率" />)
    const bar = screen.getByRole('progressbar', { name: '完成率' })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar.querySelector('div')).toHaveStyle({ width: '100%' })
  })
})
