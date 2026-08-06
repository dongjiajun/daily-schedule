/**
 * 宠物状态三段色 — PetStatus / SidebarPet 共享。
 * ≥60 绿（主题 accent 保底）/ 30-59 黄 / <30 红。
 */
export function statusColor(value: number): string {
  if (value >= 60) return 'var(--color-accent, #22c55e)'
  if (value >= 30) return '#eab308'
  return '#ef4444'
}
