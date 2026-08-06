import { useState } from 'react'
import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { PetAvatar } from './PetAvatar'
import { PetStatus } from './PetStatus'
import { PetSelection } from './PetSelection'
import { PetMenu } from './PetMenu'
import { FoodActionList } from './FoodActionList'
import { Loader2 } from 'lucide-react'

export default function PetPage() {
  const { data: pet, isLoading } = useMyPet()
  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)
  const [menuOpen, setMenuOpen] = useState(false)

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
          </div>
          <PetStatus pet={pet} isLoading={false} />

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 text-sm font-medium shadow-sm hover:bg-hover transition-colors"
            >
              🎾 互动（喂食 / 玩耍 / 商店）
            </button>

            {/* 喂食区 */}
            <section className="w-full bg-white rounded-xl border p-4">
              <h2 className="font-semibold mb-2 text-sm">喂食区 🍖</h2>
              <FoodActionList mode="feed" />
            </section>

            {/* 商店区 */}
            <section className="w-full bg-white rounded-xl border p-4">
              <h2 className="font-semibold mb-2 text-sm">商店 🛒</h2>
              <FoodActionList mode="shop" />
            </section>

            {/* 宠物信息 */}
            <section className="w-full bg-white rounded-xl border p-4">
              <h2 className="font-semibold mb-2 text-sm">宠物信息</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">名称</dt>
                <dd>{pet.name}</dd>
                <dt className="text-muted-foreground">物种</dt>
                <dd>{pet.species}</dd>
                <dt className="text-muted-foreground">等级</dt>
                <dd>Lv.{pet.level}</dd>
                <dt className="text-muted-foreground">经验</dt>
                <dd>{pet.experience}</dd>
              </dl>
            </section>
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
      <PetMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  )
}
