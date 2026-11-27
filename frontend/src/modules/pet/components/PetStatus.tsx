import type { PetProfile } from '@/api/types.gen'
import { Progress } from '@/core/components/ui/progress'
import { Skeleton } from '@/core/components/ui/skeleton'

interface PetStatusProps {
  pet: PetProfile | undefined
  isLoading: boolean
}

function statusTone(value: number): 'success' | 'warning' | 'error' {
  if (value >= 60) return 'success'
  if (value >= 30) return 'warning'
  return 'error'
}

export function PetStatus({ pet, isLoading }: PetStatusProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5 px-2 py-1 w-full" data-testid="pet-status-skeleton" aria-busy="true">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    )
  }

  if (!pet) return null

  const mood = pet.mood ?? 0
  const hunger = pet.hunger ?? 0

  return (
    <div className="flex flex-col gap-1.5 px-1 py-1 text-xs w-full" data-testid="pet-status">
      <div className="flex items-center gap-1.5">
        <span>❤️</span>
        <Progress value={mood} tone={statusTone(mood)} label="心情" className="flex-1 h-2" />
        <span className="w-7 text-right tabular-nums text-foreground-secondary">{pet.mood}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>🍖</span>
        <Progress value={hunger} tone={statusTone(hunger)} label="饱食度" className="flex-1 h-2" />
        <span className="w-7 text-right tabular-nums text-foreground-secondary">{pet.hunger}</span>
      </div>
      <div className="flex items-center gap-1 text-foreground-secondary tabular-nums">
        <span>🪙</span>
        <span>{pet.coins ?? 0}</span>
        <span className="ml-auto">⭐ Lv.{pet.level ?? 1}</span>
      </div>
    </div>
  )
}
