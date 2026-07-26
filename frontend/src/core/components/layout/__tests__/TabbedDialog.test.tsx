import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabbedDialog } from '../TabbedDialog'

describe('TabbedDialog', () => {
  const tabs = [
    { id: 'tab1', label: '标签一', content: <div>内容一</div> },
    { id: 'tab2', label: '标签二', content: <div>内容二</div> },
  ]

  it('渲染所有标签页按钮', () => {
    render(<TabbedDialog tabs={tabs} open onClose={() => {}} />)
    expect(screen.getByText('标签一')).toBeInTheDocument()
    expect(screen.getByText('标签二')).toBeInTheDocument()
  })

  it('默认显示第一个标签内容', () => {
    render(<TabbedDialog tabs={tabs} open onClose={() => {}} />)
    expect(screen.getByText('内容一')).toBeInTheDocument()
  })

  it('open 为 false 时不渲染', () => {
    render(<TabbedDialog tabs={tabs} open={false} onClose={() => {}} />)
    expect(screen.queryByText('标签一')).toBeNull()
  })
})
