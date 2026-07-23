import { eventBus } from '@/core/lib/eventBus'
import { usePetStore } from '../store/petStore'

let unsubscribers: (() => void)[] = []

/** 从 payload 中安全提取标题 */
function getTitle(payload: Record<string, unknown>): string {
  return (payload.title as string) ?? ''
}

export function registerPetEventListeners() {
  const store = usePetStore.getState()

  // ── 日程完成 → 开心 + 粒子 ──
  const unsub1 = eventBus.on('event:completed', ({ payload }) => {
    const title = getTitle(payload)
    store.incrementCombo()
    store.triggerParticle('stars')
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

  // ── 任务完成 → 开心 + 连击 + 粒子 ──
  const unsub4 = eventBus.on('task:completed', ({ payload }) => {
    const title = getTitle(payload)
    store.incrementCombo()
    store.triggerParticle('stars')
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

  unsubscribers = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6, unsub7]
}

export function unregisterPetEventListeners() {
  unsubscribers.forEach(fn => fn())
  unsubscribers = []
}
