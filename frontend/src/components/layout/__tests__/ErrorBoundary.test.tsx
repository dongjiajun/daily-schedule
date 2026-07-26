import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Suppress React error boundary logging in test output
vi.spyOn(console, 'error').mockImplementation(() => {})

function BrokenComponent() {
  throw new Error('Test crash')
}

describe('ErrorBoundary', () => {
  it('正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div>正常内容</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('正常内容')).toBeInTheDocument()
  })

  it('子组件崩溃时显示 fallback UI', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText(/页面出现错误/i)).toBeInTheDocument()
  })

  it('fallback UI 包含重新加载按钮', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText(/重新加载/)).toBeInTheDocument()
  })
})
