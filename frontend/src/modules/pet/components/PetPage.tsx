import { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  useMyPet,
  useEquippedAccessoryName,
  useUnequip,
  useInteract,
  useUpdatePet,
} from '../hooks/usePet'
import { usePetStore } from '../store/petStore'
import { PetAvatar } from './PetAvatar'
import { PetStatus } from './PetStatus'
import { FoodActionList } from './FoodActionList'
import { toFeedback } from '../lib/feedback'
import { ParticleBurst } from './ParticleBurst'
import { FloatingText } from './FloatingText'
import { Card } from '@/core/components/ui/card'
import { Badge } from '@/core/components/ui/badge'
import { Button } from '@/core/components/ui/button'
import { EmptyState } from '@/core/components/ui/empty-state'
import { Input } from '@/core/components/ui/input'
import { Skeleton } from '@/core/components/ui/skeleton'
import type { InteractionResult } from '@/api/types.gen'

const SPECIES_LABELS: Record<string, string> = {
  ORANGE_CAT: '橘猫',
  SHIBA_INU: '柴犬',
}

export default function PetPage() {
  const { data: pet, isLoading } = useMyPet()
  const accessoryName = useEquippedAccessoryName()
  const unequip = useUnequip()
  const interact = useInteract()
  const updatePet = useUpdatePet()

  const setSelectionOpen = usePetStore((s) => s.setSelectionOpen)
  const setEmotion = usePetStore((s) => s.setEmotion)
  const setAction = usePetStore((s) => s.setAction)
  const triggerParticle = usePetStore((s) => s.triggerParticle)
  const clearParticleTrigger = usePetStore((s) => s.clearParticleTrigger)
  const triggerFeedback = usePetStore((s) => s.triggerFeedback)
  const clearFeedback = usePetStore((s) => s.clearFeedback)
  const particleTrigger = usePetStore((s) => s.particleTrigger)
  const feedbackTrigger = usePetStore((s) => s.feedbackTrigger)

  const avatarWrapRef = useRef<HTMLDivElement>(null)
  const [fxOrigin, setFxOrigin] = useState({ x: 320, y: 200 })
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const refreshFxOrigin = () => {
    const rect = avatarWrapRef.current?.getBoundingClientRect()
    if (rect && rect.width > 0) {
      setFxOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
  }

  const handlePlay = () => {
    refreshFxOrigin()
    interact.mutate(
      { type: 'PLAY' },
      {
        onSuccess: (result: InteractionResult) => {
          setEmotion('excited', 3000)
          setAction('jump', 600)
          triggerParticle('stars')
          triggerFeedback(
            toFeedback(result.moodChange, result.hungerChange, result.experienceGain, result.coinChange)
          )
        },
      }
    )
  }

  const trimmedName = nameDraft.trim()
  const canSaveName = trimmedName.length > 0 && trimmedName.length <= 30 && !updatePet.isPending

  const handleSaveName = () => {
    if (!canSaveName) return
    updatePet.mutate(
      { name: trimmedName },
      {
        onSuccess: () => setEditingName(false),
      }
    )
  }

  const speciesLabel = pet?.species ? (SPECIES_LABELS[pet.species] ?? pet.species) : ''

  return (
    <div className="h-full overflow-y-auto" onPointerDownCapture={refreshFxOrigin}>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">我的宠物</h1>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        ) : pet ? (
          <>
            <AnimatePresence>
              {particleTrigger && (
                <ParticleBurst
                  key={particleTrigger.timestamp}
                  origin={fxOrigin}
                  type={particleTrigger.type}
                  count={8}
                  onDone={() => clearParticleTrigger()}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {feedbackTrigger && (
                <FloatingText
                  key={feedbackTrigger.timestamp}
                  origin={{ x: fxOrigin.x, y: fxOrigin.y - 40 }}
                  items={feedbackTrigger.items}
                  onDone={() => clearFeedback()}
                />
              )}
            </AnimatePresence>

            {/* 宠物主形象 + 状态 + 免费玩耍 */}
            <Card className="flex flex-col items-center gap-4 relative overflow-hidden">
              <div
                ref={avatarWrapRef}
                className="relative flex items-center justify-center w-full py-3 rounded-xl"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--color-accent) 10%, transparent) 0%, transparent 70%)',
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 w-28 h-4 rounded-full"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, color-mix(in srgb, var(--color-foreground) 14%, transparent) 0%, transparent 72%)',
                  }}
                />
                <PetAvatar size={200} />
              </div>
              <PetStatus pet={pet} isLoading={false} />
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePlay}
                disabled={interact.isPending}
              >
                🎾 玩耍（免费）
              </Button>
            </Card>

            {/* 喂食区（仅 FOOD） */}
            <Card className="space-y-3">
              <h2 className="font-semibold text-sm text-foreground">喂食区 🍖</h2>
              <FoodActionList mode="feed" layout="grid" />
            </Card>

            {/* 装扮区（当前配饰 + ACCESSORY 商店/装备） */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm text-foreground">装扮区 🎀</h2>
                {accessoryName ? (
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{accessoryName}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unequip.mutate()}
                      disabled={unequip.isPending}
                    >
                      取下
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-foreground-muted">未装备任何配饰</span>
                )}
              </div>
              <FoodActionList mode="accessory" layout="grid" />
            </Card>

            {/* 宠物信息 + 内联改名 */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm text-foreground">宠物信息</h2>
                {!editingName && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNameDraft(pet.name ?? '')
                      setEditingName(true)
                    }}
                  >
                    改名
                  </Button>
                )}
              </div>

              {editingName && (
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="宠物名称"
                    value={nameDraft}
                    maxLength={30}
                    placeholder="输入新名字…"
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={!canSaveName}>
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                    取消
                  </Button>
                </div>
              )}

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-foreground-muted">名称</dt>
                <dd className="text-foreground">{pet.name}</dd>
                <dt className="text-foreground-muted">物种</dt>
                <dd className="text-foreground">{speciesLabel}</dd>
                <dt className="text-foreground-muted">等级</dt>
                <dd className="text-foreground tabular-nums">Lv.{pet.level}</dd>
                <dt className="text-foreground-muted">经验</dt>
                <dd className="text-foreground tabular-nums">{pet.experience}</dd>
              </dl>
            </Card>
          </>
        ) : (
          <Card>
            <EmptyState
              icon={<span className="text-xl">🐾</span>}
              title="你还没有宠物"
              description="领养一只专属伙伴，陪你完成每日日程与任务"
              action={
                <Button size="sm" onClick={() => setSelectionOpen(true)}>
                  领养伙伴
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </div>
  )
}
