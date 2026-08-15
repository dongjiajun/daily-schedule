import { useState } from 'react'
import { Popover, PopoverContent } from '@/core/components/ui/popover'
import { Button } from '@/core/components/ui/button'
import { useMyPet, useInteract } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import type { FeedbackItem } from '../store/petStore'
import type { InteractionResult } from '@/api/types.gen'
import { FoodActionList } from './FoodActionList'

interface PetMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 将互动结果转为浮动数值项（变化量非零项） */
function toFeedback(
  mood: number | undefined,
  hunger: number | undefined,
  exp: number | undefined,
  coins: number | undefined
): FeedbackItem[] {
  const items: FeedbackItem[] = []
  const push = (delta: number | undefined, label: string) => {
    if (!delta || delta === 0) return
    items.push({ text: delta > 0 ? `+${delta} ${label}` : `${delta} ${label}`, tone: delta > 0 ? 'good' : 'bad' })
  }
  push(mood, '心情')
  push(hunger, '饱腹')
  push(exp, '经验')
  push(coins, '金币')
  return items
}

/**
 * 互动菜单 — 喂食 / 玩耍 / 商店购买（食物列表复用 FoodActionList）。
 * 由 hover 浮窗"互动"按钮或宠物详情页打开。
 */
export function PetMenu({ open, onOpenChange }: PetMenuProps) {
  const { data: pet } = useMyPet()
  const interact = useInteract()

  const coins = pet?.coins ?? 0
  const triggerParticle = usePetStore((s) => s.triggerParticle)
  const triggerFeedback = usePetStore((s) => s.triggerFeedback)
  const setEmotion = usePetStore((s) => s.setEmotion)

  const [tab, setTab] = useState<'feed' | 'shop'>('feed')

  const handlePlay = () => {
    interact.mutate(
      { type: 'PLAY' },
      {
        onSuccess: (result: InteractionResult) => {
          setEmotion('excited', 3000)
          triggerParticle('stars')
          triggerFeedback(toFeedback(result.moodChange, result.hungerChange, result.experienceGain, result.coinChange))
        },
      }
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-72" align="center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">宠物互动</span>
            <span className="text-xs text-foreground-secondary">🪙 {coins}</span>
          </div>

          {/* 玩耍（常驻） */}
          <Button size="sm" variant="outline" onClick={handlePlay} disabled={interact.isPending}>
            🎾 玩耍（免费）
          </Button>

          {/* tab 切换：喂食 / 商店 */}
          <div className="flex rounded-lg bg-hover p-0.5 text-xs">
            <button
              className={`flex-1 rounded-md py-1.5 transition-colors ${tab === 'feed' ? 'bg-surface shadow-sm' : 'text-foreground-secondary'}`}
              onClick={() => setTab('feed')}
            >
              喂食
            </button>
            <button
              className={`flex-1 rounded-md py-1.5 transition-colors ${tab === 'shop' ? 'bg-surface shadow-sm' : 'text-foreground-secondary'}`}
              onClick={() => setTab('shop')}
            >
              商店
            </button>
          </div>

          {/* 食物/商品列表（共享组件） */}
          <div className="max-h-56 overflow-y-auto">
            <FoodActionList mode={tab} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
