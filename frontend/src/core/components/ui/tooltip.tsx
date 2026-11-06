import * as React from 'react'
import { cn } from '@/core/lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement<{ 'aria-describedby'?: string }>
  side?: 'top' | 'bottom'
  className?: string
}

/**
 * 轻量 tooltip：悬停与键盘聚焦（focus-within）触发，通过 aria-describedby 关联目标。
 * 不引入新依赖；文本常驻 DOM（透明态）以便屏幕阅读器读取描述。
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = React.useId()
  const describedBy = [children.props['aria-describedby'], id].filter(Boolean).join(' ')

  return (
    <span className="group/tooltip relative inline-flex">
      {React.cloneElement(children, { 'aria-describedby': describedBy })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-accent px-2 py-1 text-2xs text-accent-fg opacity-0 shadow-float transition-opacity duration-fast',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          className
        )}
      >
        {content}
      </span>
    </span>
  )
}
