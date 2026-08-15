import { Button } from '@/core/components/ui/button'
import { useMyPet, useInteract, useShopItems, usePurchase } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import type { FeedbackItem, ParticleType } from '../store/petStore'
import type { InteractionResult, PurchaseResult } from '@/api/types.gen'

interface FoodActionListProps {
  /** feed: 喂食（interact FEED）/ shop: 购买（purchase） */
  mode: 'feed' | 'shop'
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
 * 食物/商品操作列表 — PetMenu 与 PetPage 共享。
 * mode=feed: 点击喂食（interact FEED）；mode=shop: 点击购买（purchase）。
 * 成功 → 浮动数值 + 对应粒子（food/coins）+ toast + 状态刷新。
 */
export function FoodActionList({ mode }: FoodActionListProps) {
  const { data: pet } = useMyPet()
  const { data: items = [] } = useShopItems()
  const interact = useInteract()
  const purchase = usePurchase()

  const coins = pet?.coins ?? 0
  const currentAccessory = pet?.currentAccessory
  const triggerParticle = usePetStore((s) => s.triggerParticle)
  const triggerFeedback = usePetStore((s) => s.triggerFeedback)
  const setEmotion = usePetStore((s) => s.setEmotion)
  const setAction = usePetStore((s) => s.setAction)

  const fireFeedback = (particle: ParticleType, feedback: FeedbackItem[]) => {
    triggerParticle(particle)
    triggerFeedback(feedback)
  }

  const handleFeed = (itemId: number) => {
    interact.mutate(
      { type: 'FEED', itemId },
      {
        onSuccess: (result: InteractionResult) => {
          setEmotion('happy', 3000)
          setAction('eat', 1500) // 进食动作：低头张嘴咀嚼 1.5s 后自动回 idle（actionTimer）
          fireFeedback('food', toFeedback(result.moodChange, result.hungerChange, result.experienceGain, result.coinChange))
        },
      }
    )
  }

  const handlePurchase = (itemId: number) => {
    purchase.mutate(
      { itemId, quantity: 1 },
      {
        onSuccess: (result: PurchaseResult) => {
          if (result.equippedAccessoryId) {
            // 装备成功：开心情绪反馈（非进食），toast 由 usePurchase 提示「已装备」
            setEmotion('happy', 3000)
          } else {
            setAction('eat', 1500) // 食物购买呈现进食反馈（spec: 购买触发 eat）
          }
          fireFeedback('coins', toFeedback(undefined, undefined, undefined, -(result.totalCost ?? 0)))
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.length === 0 && (
        <p className="text-xs text-foreground-secondary text-center py-3">商店空空如也</p>
      )}
      {items.map((item) => {
        const isAccessory = item.type === 'ACCESSORY'
        const equipped = isAccessory && currentAccessory != null && currentAccessory === item.id
        const affordable = coins >= (item.price ?? 0)
        const pending = interact.isPending || purchase.isPending
        const isFeed = mode === 'feed'
        return (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border-subtle px-2.5 py-2">
            <span className="text-base">{isFeed ? '🍖' : isAccessory ? '🎀' : '🛒'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-tight truncate">
                {item.name}
                {equipped && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-fg">已装备</span>
                )}
              </p>
              <p className="text-[11px] text-foreground-secondary leading-tight">
                {item.price ?? 0}🪙
                {isAccessory ? ' · 纯外观' : ` · +${item.effectHunger ?? 0}饱腹 +${item.effectMood ?? 0}心情`}
              </p>
            </div>
            <Button
              size="sm"
              aria-label={`${isFeed ? '喂食' : isAccessory ? '装备' : '购买'}-${item.name}`}
              disabled={!affordable || pending || equipped}
              title={equipped ? '已装备' : affordable ? undefined : '专注币不足'}
              onClick={() => (isFeed ? handleFeed(item.id!) : handlePurchase(item.id!))}
            >
              {isFeed ? '喂食' : isAccessory ? (equipped ? '已装备' : '装备') : '购买'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
