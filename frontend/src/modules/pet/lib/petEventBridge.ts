import { eventBus } from '@/core/lib/eventBus'
import { usePetStore } from '../store/petStore'

let unsubscribers: (() => void)[] = []

/** 从 payload 中安全提取标题（calendar 事件有 title，其他事件 fallback） */
function getTitle(payload: Record<string, unknown>): string {
  return (payload.title as string) ?? ''
}

export function registerPetEventListeners() {
  const store = usePetStore.getState()

  const unsub1 = eventBus.on('event:completed', ({ payload }) => {
    store.triggerAnimation('happy')
    store.showBubble(`太棒了！「${getTitle(payload)}」已完成！`)
  })

  const unsub2 = eventBus.on('event:created', ({ payload }) => {
    store.triggerAnimation('happy')
    store.showBubble(`新日程「${getTitle(payload)}」已安排`)
  })

  const unsub3 = eventBus.on('event:cancelled', ({ payload }) => {
    store.triggerAnimation('sad')
    store.showBubble(`「${getTitle(payload)}」取消了…`)
  })

  const unsub4 = eventBus.on('task:completed', ({ payload }) => {
    const title = getTitle(payload)
    store.triggerAnimation('happy')
    store.showBubble(`任务「${title}」完成！你真棒！✅`)
  })

  const unsub5 = eventBus.on('task:created', () => {
    store.showBubble('新任务已就绪，一起加油！💪')
  })

  unsubscribers = [unsub1, unsub2, unsub3, unsub4, unsub5]
}

export function unregisterPetEventListeners() {
  unsubscribers.forEach(fn => fn())
  unsubscribers = []
}
