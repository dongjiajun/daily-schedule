import * as React from 'react'
import { cn } from '@/core/lib/utils'

export interface KbdProps {
  children: React.ReactNode
  className?: string
}

/** 键帽：快捷键提示统一外观。 */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[24px] items-center justify-center rounded-md border border-border bg-hover px-1.5 py-1 font-mono text-2xs text-foreground-muted',
        className
      )}
    >
      {children}
    </kbd>
  )
}
