import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { PetAvatar } from './PetAvatar'
import { PetStatus } from './PetStatus'
import { PetMenu } from './PetMenu'
import { PetSelection } from './PetSelection'
import { Loader2 } from 'lucide-react'

export default function PetPage() {
  const { data: pet, isLoading } = useMyPet()
  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">我的宠物</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : pet ? (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <PetAvatar size={200} />
            <PetMenu />
          </div>
          <PetStatus pet={pet} isLoading={false} />

          <div className="w-full bg-white rounded-xl border p-4">
            <h2 className="font-semibold mb-2">宠物信息</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">名称</dt>
              <dd>{pet.name}</dd>
              <dt className="text-muted-foreground">物种</dt>
              <dd>{pet.species}</dd>
              <dt className="text-muted-foreground">经验</dt>
              <dd>{pet.experience}</dd>
            </dl>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>你还没有宠物</p>
          <button
            className="mt-2 text-blue-500 hover:underline"
            onClick={() => setSelectionOpen(true)}
          >
            创建一个
          </button>
        </div>
      )}

      <PetSelection />
    </div>
  )
}
