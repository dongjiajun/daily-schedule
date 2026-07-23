import type { PetProfile } from '@/api/types.gen'

interface PetStatusProps {
  pet: PetProfile | undefined
  isLoading: boolean
}

export function PetStatus({ pet, isLoading }: PetStatusProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 px-2 py-1 w-full" data-testid="pet-status-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
    )
  }

  if (!pet) return null

  return (
    <div className="flex flex-col gap-1.5 px-1 py-1 text-xs w-full" data-testid="pet-status">
      <div className="flex items-center gap-1.5">
        <span>❤️</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-accent"
            style={{ width: `${pet.mood ?? 0}%`, opacity: Math.max(0.3, (pet.mood ?? 0) / 100) }}
          />
        </div>
        <span className="w-7 text-right tabular-nums text-foreground-secondary">{pet.mood}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>🍖</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-accent"
            style={{ width: `${pet.hunger ?? 0}%`, opacity: Math.max(0.3, (pet.hunger ?? 0) / 100) }}
          />
        </div>
        <span className="w-7 text-right tabular-nums text-foreground-secondary">{pet.hunger}</span>
      </div>
      <div className="flex items-center gap-1 text-foreground-secondary">
        <span>🪙</span>
        <span>{pet.coins ?? 0}</span>
        <span className="ml-auto">⭐ Lv.{pet.level ?? 1}</span>
      </div>
    </div>
  )
}
