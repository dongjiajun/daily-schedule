import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/core/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-transparent bg-hover text-foreground-secondary',
        accent: 'border-transparent bg-accent text-accent-fg',
        success: 'border-success/30 bg-success-bg text-success-fg',
        error: 'border-error/30 bg-error-bg text-error-fg',
        warning: 'border-warning/30 bg-warning-bg text-warning-fg',
        info: 'border-info/30 bg-info-bg text-info-fg',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** 标签 / 状态徽标：统一颜色语义与字号，替代各处手写 rounded-full chip。 */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
