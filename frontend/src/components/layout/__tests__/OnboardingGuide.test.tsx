import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingGuide } from '../OnboardingGuide'

describe('OnboardingGuide', () => {
  it('第一步显示欢迎标题', () => {
    render(<OnboardingGuide onClose={vi.fn()} />)
    expect(screen.getByText('欢迎使用日程管理')).toBeInTheDocument()
  })

  it('点击「下一步」进入第二步', () => {
    render(<OnboardingGuide onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('下一步'))
    expect(screen.getByText('创建你的第一个日程')).toBeInTheDocument()
  })

  it('点击「下一步」进入第三步', () => {
    render(<OnboardingGuide onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('下一步'))
    fireEvent.click(screen.getByText('下一步'))
    expect(screen.getByText('拖拽调整 · 一键完成')).toBeInTheDocument()
  })

  it('最后一步点击「开始使用」调用 onClose', () => {
    const onClose = vi.fn()
    render(<OnboardingGuide onClose={onClose} />)
    // 快速跳到第三步
    fireEvent.click(screen.getByText('下一步'))
    fireEvent.click(screen.getByText('下一步'))
    fireEvent.click(screen.getByText('开始使用'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('点击 X 关闭按钮调用 onClose', () => {
    const onClose = vi.fn()
    render(<OnboardingGuide onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('关闭引导'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('点击「跳过」按钮调用 onClose', () => {
    const onClose = vi.fn()
    render(<OnboardingGuide onClose={onClose} />)
    fireEvent.click(screen.getByText('跳过'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('点击步骤点直接跳转', () => {
    render(<OnboardingGuide onClose={vi.fn()} />)
    // 点击第三个步骤指示点
    const dots = screen.getAllByLabelText(/步骤/)
    fireEvent.click(dots[2])
    expect(screen.getByText('拖拽调整 · 一键完成')).toBeInTheDocument()
  })

  it('最后一步没有「跳过」按钮', () => {
    render(<OnboardingGuide onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('下一步'))
    fireEvent.click(screen.getByText('下一步'))
    expect(screen.queryByText('跳过')).toBeNull()
  })
})
