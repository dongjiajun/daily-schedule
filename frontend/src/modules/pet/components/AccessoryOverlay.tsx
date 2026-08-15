/**
 * 宠物装扮叠加层组件。
 * 渲染方式（名称 → kind）定义在 lib/accessoryRenderMap.ts（单一来源）；
 * 皮肤类由 SvgAvatar 对基础插画应用 CSS filter，本组件返回 null。
 * 未知名称 → 静默回退（不渲染）。
 */
import { ACCESSORY_RENDER_MAP } from '../lib/accessoryRenderMap'

interface AccessoryOverlayProps {
  name?: string | null
  size?: number
  className?: string
}

export function AccessoryOverlay({ name, size = 100, className }: AccessoryOverlayProps) {
  if (!name) return null
  const render = ACCESSORY_RENDER_MAP[name]
  if (!render || render.kind === 'skin') return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {render.kind === 'hat' && (
        <>
          <path d="M50 6 L34 22 L66 22 Z" fill={render.color} />
          {render.brim && <ellipse cx="50" cy="22" rx="20" ry="3.5" fill={render.color} />}
          <rect x="48" y="10" width="4" height="4" rx="1" fill="#FBBF24" />
        </>
      )}
      {render.kind === 'partyHat' && (
        <>
          <path d="M50 2 L36 21 L64 21 Z" fill={render.color} />
          <circle cx="50" cy="2.5" r="3" fill="#FFD700" />
          <rect x="42" y="12" width="4" height="7" rx="1" fill="#FFFFFF" opacity="0.7" transform="skewX(14)" />
        </>
      )}
      {render.kind === 'cap' && (
        <>
          <path d="M34 22 A16 14 0 0 1 66 22 Z" fill={render.color} />
          <rect x="33" y="21" width="34" height="3" rx="1.5" fill={render.color} />
          <circle cx="50" cy="11" r="2.5" fill="#A7F3D0" />
        </>
      )}
      {render.kind === 'turkeyHat' && (
        <>
          <path d="M34 22 A16 13 0 0 1 66 22 Z" fill="#92400E" />
          <path d="M50 10 Q55 4 62 7" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M50 11 Q44 5 38 8" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M50 10 L50 3" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {render.kind === 'antler' && (
        <g stroke="#8B4513" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M32 22 L27 12 L24 5" />
          <path d="M27 12 L21 9" />
          <path d="M68 22 L73 12 L76 5" />
          <path d="M73 12 L79 9" />
        </g>
      )}
      {render.kind === 'ear' && (
        <>
          <ellipse cx="39" cy="10" rx="6" ry="14" fill="#FDE68A" transform="rotate(-12 39 10)" />
          <ellipse cx="39" cy="11" rx="3.2" ry="10" fill="#F9A8D4" transform="rotate(-12 39 11)" />
          <ellipse cx="61" cy="10" rx="6" ry="14" fill="#FDE68A" transform="rotate(12 61 10)" />
          <ellipse cx="61" cy="11" rx="3.2" ry="10" fill="#F9A8D4" transform="rotate(12 61 11)" />
        </>
      )}
      {render.kind === 'flower' && (
        <g transform="translate(66 20)">
          {[0, 72, 144, 216, 288].map((deg) => (
            <circle key={deg} cx={Math.cos((deg * Math.PI) / 180) * 4.5} cy={Math.sin((deg * Math.PI) / 180) * 4.5} r="3.2" fill="#F9A8D4" />
          ))}
          <circle r="2.8" fill="#FDE047" />
        </g>
      )}
      {render.kind === 'backpack' && (
        <g transform="translate(76 54)">
          <path d="M-8 0 L0 -6 L8 0 L8 14 L-8 14 Z" fill="#2E7D32" />
          <path d="M-4 0 L0 -3 L4 0 L0 4 Z" fill="#66BB6A" />
          <path d="M-6 4 L6 4" stroke="#1B5E20" strokeWidth="1.2" />
          <path d="M-6 9 L6 9" stroke="#1B5E20" strokeWidth="1.2" />
        </g>
      )}
    </svg>
  )
}
