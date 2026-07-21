import type { PetProfile } from '@/api/types.gen'

interface PetStatusProps {
  pet: PetProfile | undefined
  isLoading: boolean
}

function statusColor(value: number | undefined): string {
  if (value == null) return '#9ca3af'
  if (value >= 60) return '#22c55e'
  if (value >= 30) return '#eab308'
  return '#ef4444'
}

export function PetStatus({ pet, isLoading }: PetStatusProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 px-2 py-1" data-testid="pet-status-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
    )
  }

  if (!pet) return null

  return (
    <div className="flex flex-col gap-1 px-2 py-1 text-xs" data-testid="pet-status">
      <div className="flex items-center gap-1">
        <span>❤️</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pet.mood ?? 0}%`, backgroundColor: statusColor(pet.mood) }}
          />
        </div>
        <span className="w-7 text-right tabular-nums">{pet.mood}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>🍖</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pet.hunger ?? 0}%`, backgroundColor: statusColor(pet.hunger) }}
          />
        </div>
        <span className="w-7 text-right tabular-nums">{pet.hunger}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>🪙</span>
        <span>{pet.coins ?? 0}</span>
        <span className="ml-auto">⭐ Lv.{pet.level ?? 1}</span>
      </div>
    </div>
  )
}
