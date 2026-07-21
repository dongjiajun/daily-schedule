import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** 静默模式：出错时渲染空节点而非全屏错误页 */
  silent?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.silent) return null
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="text-lg font-semibold text-foreground-secondary">页面出现错误</div>
            <p className="text-sm text-foreground-muted">{this.state.error?.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm hover:bg-accent-hover"
            >
              重新加载
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
