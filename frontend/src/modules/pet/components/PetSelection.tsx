import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { useCreatePet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import type { CreatePetRequest } from '@/api/types.gen'
import { Cat, Dog } from 'lucide-react'

const SPECIES_OPTIONS = [
  { value: 'ORANGE_CAT' as const, label: '橘猫', icon: Cat, desc: '活泼好动，擅长提醒' },
  { value: 'SHIBA_INU' as const, label: '柴犬', icon: Dog, desc: '忠诚稳重，擅长鼓励' },
]

export function PetSelection() {
  const open = usePetStore((s) => s.selectionOpen)
  const setOpen = usePetStore((s) => s.setSelectionOpen)
  const [species, setSpecies] = useState<CreatePetRequest['species']>('ORANGE_CAT')
  const [name, setName] = useState('')
  const createPet = useCreatePet()

  const isValid = name.trim().length > 0 && name.trim().length <= 30

  const handleSubmit = () => {
    if (!isValid) return
    createPet.mutate({ species, name: name.trim() }, {
      onSuccess: () => setOpen(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>选择你的伙伴</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3">
          {SPECIES_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const selected = species === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setSpecies(opt.value)}
                className={`
                  flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <Icon className={`w-10 h-10 ${selected ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="pet-name">命名</Label>
          <Input
            id="pet-name"
            placeholder="给你的伙伴起个名字…"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <span className="text-xs text-muted-foreground text-right">{name.length}/30</span>
        </div>

        <Button onClick={handleSubmit} disabled={!isValid || createPet.isPending}>
          {createPet.isPending ? '创建中…' : '确认选择'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
