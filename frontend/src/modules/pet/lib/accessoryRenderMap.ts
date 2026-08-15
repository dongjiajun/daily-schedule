/**
 * 配饰名称 → 渲染方式映射（单一来源）。
 * 名称即身份：与 packages/shared/src/holiday/themeMapping.ts 的 petAccessory 声明
 * 及数据库 pet_accessories 种子逐一对齐。
 * 叠加层类：与基础插画同 viewBox 的独立 SVG 叠放；皮肤类：对基础插画应用 CSS filter
 * 近似（非逐图层重绘，M2.4 需要高质量皮肤时再升级）。
 */

export type AccessoryKind =
  | { kind: 'skin'; filter: string }
  | { kind: 'hat'; color: string; brim?: boolean }
  | { kind: 'partyHat'; color: string }
  | { kind: 'cap'; color: string }
  | { kind: 'turkeyHat' }
  | { kind: 'antler' }
  | { kind: 'ear' }
  | { kind: 'flower' }
  | { kind: 'backpack' }

export const ACCESSORY_RENDER_MAP: Record<string, AccessoryKind> = {
  '年兽皮肤': { kind: 'skin', filter: 'hue-rotate(140deg) saturate(1.3)' },
  '玉兔皮肤': { kind: 'skin', filter: 'brightness(1.5) saturate(0.25)' },
  '印度象皮肤': { kind: 'skin', filter: 'grayscale(0.75) brightness(0.7)' },
  '麋鹿角': { kind: 'antler' },
  '巫师帽': { kind: 'hat', color: '#312E81', brim: true },
  '新年帽': { kind: 'partyHat', color: '#E63946' },
  '火鸡帽': { kind: 'turkeyHat' },
  '绿帽子': { kind: 'cap', color: '#2E7D32' },
  '樱花发饰': { kind: 'flower' },
  '粽子背包': { kind: 'backpack' },
  '兔耳朵': { kind: 'ear' },
}

/** 皮肤类配饰的 CSS filter（供 SvgAvatar 应用到基础插画）；非皮肤返回 undefined。 */
export function getSkinFilter(name: string | null | undefined): string | undefined {
  if (!name) return undefined
  const render = ACCESSORY_RENDER_MAP[name]
  return render?.kind === 'skin' ? render.filter : undefined
}
