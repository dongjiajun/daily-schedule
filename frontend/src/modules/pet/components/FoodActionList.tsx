import { Button } from '@/core/components/ui/button'
import { Badge } from '@/core/components/ui/badge'
import { useMyPet, useInteract, useShopItems, usePurchase } from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import type { FeedbackItem, ParticleType } from '../store/petStore'
import type { InteractionResult, PurchaseResult } from '@/api/types.gen'
import { toFeedback } from '../lib/feedback'

interface FoodActionListProps {
  /** feed: 喂食（仅 FOOD）/ accessory: 装扮（仅 ACCESSORY）/ shop: 完整商店 */
  mode: 'feed' | 'shop' | 'accessory'
  /** list: 窄浮层单列 / grid: 专页桌面双列卡片网格 */
  layout?: 'list' | 'grid'
}

/**
 * 食物/商品操作列表 — PetMenu 与 PetPage 共享。
 * mode=feed: 点击喂食（interact FEED）；mode=shop: 点击购买（purchase）。
 * 成功 → 浮动数值 + 对应粒子（food/coins）+ toast + 状态刷新。
 */
export function FoodActionList({ mode, layout = 'list' }: FoodActionListProps) {
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

  const visibleItems =
    mode === 'feed'
      ? items.filter((item) => item.type !== 'ACCESSORY')
      : mode === 'accessory'
        ? items.filter((item) => item.type === 'ACCESSORY')
        : items

  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5' : 'flex flex-col gap-1.5'}>
      {visibleItems.length === 0 && (
        <p className="text-xs text-foreground-secondary text-center py-3 sm:col-span-2">
          {mode === 'feed' ? '暂无可用食物' : mode === 'accessory' ? '暂无可装备配饰' : '商店空空如也'}
        </p>
      )}
      {visibleItems.map((item) => {
        const isAccessory = item.type === 'ACCESSORY'
        const equipped = isAccessory && currentAccessory != null && currentAccessory === item.id
        const affordable = coins >= (item.price ?? 0)
        const pending = interact.isPending || purchase.isPending
        const isFeed = mode === 'feed'
        return (
          <div
            key={item.id}
            className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-elevated p-2.5 hover:border-border transition-colors duration-fast"
          >
            <span className="w-9 h-9 rounded-lg bg-hover flex items-center justify-center text-base shrink-0">
              {isFeed ? '🍖' : isAccessory ? '🎀' : '🛒'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-tight truncate text-foreground">
                {item.name}
                {equipped && (
                  <Badge tone="accent" className="ml-1.5">已装备</Badge>
                )}
              </p>
              <p className="text-2xs text-foreground-secondary leading-tight tabular-nums">
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
