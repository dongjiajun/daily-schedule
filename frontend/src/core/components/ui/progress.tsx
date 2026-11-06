import { cn } from '@/core/lib/utils'

const TONE_CLASS: Record<NonNullable<ProgressProps['tone']>, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

export interface ProgressProps {
  value: number
  tone?: 'accent' | 'success' | 'warning' | 'error'
  label?: string
  className?: string
}

/** 进度条：统计/状态共用，自带 progressbar 语义。 */
export function Progress({ value, tone = 'accent', label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-hover', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-slow', TONE_CLASS[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
