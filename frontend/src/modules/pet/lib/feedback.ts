import type { FeedbackItem } from '../store/petStore'

/** 将互动结果转为浮动数值项（变化量非零项） */
export function toFeedback(
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
