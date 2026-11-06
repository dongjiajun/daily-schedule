import * as React from 'react'
import { cn } from '@/core/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 分段控件（视图切换 / 密度切换）：radiogroup 语义 + 方向键移动焦点。
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  const move = (delta: number) => {
    const next = (index + delta + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-lg bg-hover p-0.5', className)}
    >
      {options.map((option, i) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[i] = element
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault()
                move(1)
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault()
                move(-1)
              }
            }}
            className={cn(
              'flex items-center justify-center gap-1 rounded-md font-medium transition-colors duration-fast',
              size === 'md' ? 'h-[calc(var(--density-control-h)-4px)] px-3 text-sm' : 'h-7 px-2 text-2xs',
              active
                ? 'bg-accent text-accent-fg shadow-card'
                : 'text-foreground-muted hover:text-foreground-secondary'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
