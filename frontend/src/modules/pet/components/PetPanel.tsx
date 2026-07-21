import { useEffect } from 'react'
import { useMyPet } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { PetAvatar } from './PetAvatar'
import { PetBubble } from './PetBubble'
import { PetStatus } from './PetStatus'
import { PetMenu } from './PetMenu'
import { PetSelection } from './PetSelection'
import { Loader2 } from 'lucide-react'

export function PetPanel() {
  const { data: pet, isLoading, isError } = useMyPet()
  const selectionOpen = usePetStore((s) => s.selectionOpen)
  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)

  // 无宠物时自动弹出选择框
  useEffect(() => {
    if (isError && !isLoading) {
      setSelectionOpen(true)
    }
  }, [isError, isLoading, setSelectionOpen])

  return (
    <>
      <PetSelection />

      <div className="fixed bottom-4 right-4 z-40">
        <div
          className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-3 flex flex-col items-center gap-2"
          style={{ width: 140 }}
        >
          <div className="relative">
            <PetBubble />
            <PetAvatar size={80} />
            <PetMenu />
          </div>

          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : pet ? (
            <PetStatus pet={pet} isLoading={false} />
          ) : (
            !selectionOpen && (
              <span
                className="text-xs text-gray-400 cursor-pointer hover:text-blue-500"
                onClick={() => setSelectionOpen(true)}
              >
                点击创建宠物
              </span>
            )
          )}
        </div>
      </div>
    </>
  )
}
