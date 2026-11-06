/**
 * 宠物状态三段色 — PetStatus / SidebarPet 共享。
 * ≥60 成功 / 30-59 警告 / <30 危险（全部走语义 token，随主题深浅自动适配）。
 */
export function statusColor(value: number): string {
  if (value >= 60) return 'var(--color-success)'
  if (value >= 30) return 'var(--color-warning)'
  return 'var(--color-error)'
}
