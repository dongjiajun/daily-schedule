import * as React from 'react'
import { cn } from '@/core/lib/utils'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

/** 加载占位：装饰性（aria-hidden），尺寸由调用方按目标内容给出。 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-hover', className)} {...props} />
}
