import { eventBus } from '@/core/lib/eventBus'
import { queryClient } from '@/core/lib/queryClient'
import { unwrap } from '@/core/lib/unwrap'
import { grantPetReward } from '@/api/sdk.gen'
import type { GrantRewardRequest } from '@/api/types.gen'
import { usePetStore } from '../store/petStore'

let unsubscribers: (() => void)[] = []

/** 从 payload 中安全提取标题 */
function getTitle(payload: Record<string, unknown>): string {
  return (payload.title as string) ?? ''
}

/** 从 payload 中安全提取字符串字段（事件联合类型不按 type 判别收窄） */
function pickString(payload: Record<string, unknown>, key: string): string | undefined {
  const v = payload[key]
  return typeof v === 'string' ? v : undefined
}

/** 从 payload 中安全提取数字字段 */
function pickNumber(payload: Record<string, unknown>, key: string): number | undefined {
  const v = payload[key]
  return typeof v === 'number' ? v : undefined
}

/**
 * 领取行为奖励（幂等）：granted=true 时刷新宠物数据 + 金币粒子 + 气泡。
 * 失败/无宠物静默忽略——奖励属于锦上添花，不阻断其他监听器。
 */
async function claimReward(source: GrantRewardRequest['source'], refId: string) {
  const store = usePetStore.getState()
  try {
    const result = unwrap(await grantPetReward({ body: { source, refId } }))
    if (result.granted) {
      queryClient.invalidateQueries({ queryKey: ['pet', 'me'] })
      store.triggerParticle('coins')
      store.showBubble(`+${result.coinChange} 专注币`)
    }
  } catch {
    // 无宠物（404）或网络失败：静默
  }
}

/** 本地日期 YYYY-MM-DD（每日签到幂等键） */
function localDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 后端挂钩发放的奖励即时刷新（任务/日程完成 → 专注币变化） */
function refreshPetData() {
  queryClient.invalidateQueries({ queryKey: ['pet', 'me'] })
}

export function registerPetEventListeners() {
  const store = usePetStore.getState()

  // ── 日程完成 → 开心 + 粒子 + 刷新专注币 ──
  const unsub1 = eventBus.on('event:completed', ({ payload }) => {
    const title = getTitle(payload)
    store.incrementCombo()
    store.triggerParticle('stars')
    refreshPetData()
    // incrementCombo 内部处理 setEmotion (3+ 连击 → excited, 否则 happy)
    setTimeout(() => {
      store.showBubble(`太棒了！「${title}」已完成！🎉`)
    }, 300)
  })

  // ── 日程创建 → 轻度开心 ──
  const unsub2 = eventBus.on('event:created', ({ payload }) => {
    store.setEmotion('happy', 3000)
    setTimeout(() => {
      store.showBubble(`新日程「${getTitle(payload)}」已安排`)
    }, 300)
  })

  // ── 日程取消 → 失落 ──
  const unsub3 = eventBus.on('event:cancelled', ({ payload }) => {
    store.resetCombo()
    store.setEmotion('sad', 5000)
    setTimeout(() => {
      store.showBubble(`「${getTitle(payload)}」取消了…`)
    }, 300)
  })

  // ── 任务完成 → 开心 + 连击 + 粒子 + 刷新专注币 ──
  const unsub4 = eventBus.on('task:completed', ({ payload }) => {
    const title = getTitle(payload)
    store.incrementCombo()
    store.triggerParticle('stars')
    refreshPetData()
    setTimeout(() => {
      store.showBubble(`任务「${title}」完成！你真棒！✅`)
    }, 300)
  })

  // ── 任务创建 → 点头 ──
  const unsub5 = eventBus.on('task:created', () => {
    store.setEmotion('idle_variant', 2500)
    setTimeout(() => {
      store.showBubble('新任务已就绪，一起加油！💪')
    }, 300)
  })

  // ── 习惯打卡 → 奖励（Phase 2 habits 模块预留）──
  const unsub8 = eventBus.on('habit:checked', ({ payload }) => {
    void claimReward('HABIT_CHECKED', pickString(payload, 'habitId') ?? '')
  })

  // ── 专注完成 → 奖励（Phase 2 pomodoro 模块预留）──
  const unsub9 = eventBus.on('focus:completed', ({ payload }) => {
    void claimReward('FOCUS_COMPLETED', pickString(payload, 'sessionId') ?? String(Date.now()))
  })

  // ── 每日签到 → 奖励（每日一次，按本地日期幂等）──
  const unsub10 = eventBus.on('user:dailyCheckin', ({ payload }) => {
    void claimReward('DAILY_CHECKIN', localDateKey(pickNumber(payload, 'timestamp') ?? Date.now()))
  })

  // ── 连击超时重置 (30s 无新事件) ──
  let comboTimer: ReturnType<typeof setTimeout> | null = null
  const resetComboTimer = () => {
    if (comboTimer) clearTimeout(comboTimer)
    comboTimer = setTimeout(() => {
      store.resetCombo()
    }, 30_000)
  }

  const unsub6 = eventBus.on('event:completed', resetComboTimer)
  const unsub7 = eventBus.on('task:completed', resetComboTimer)

  unsubscribers = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6, unsub7, unsub8, unsub9, unsub10]
}

export function unregisterPetEventListeners() {
  unsubscribers.forEach(fn => fn())
  unsubscribers = []
}
