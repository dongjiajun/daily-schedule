import * as React from 'react'
import { cn } from '@/core/lib/utils'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

/**
 * 通用卡片容器：表面色 + 细边框 + 卡片阴影 + 密度内边距。
 * 业务层只传布局类（如 space-y-2），不重复写颜色/圆角/阴影。
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-border-subtle bg-surface p-[var(--density-card-pad)] shadow-card',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'
