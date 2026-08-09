/* eslint-disable react-hooks/purity -- useMemo wraps Math.random(), stable per count change */

import { useMemo } from 'react'

interface Leaf {
  id: number
  left: string
  top: string
  fontSize: string
  animationDuration: string
  animationDelay: string
  emoji: string
}

const LEAVES = ['🍂', '🍁', '🌿', '🍃']

/**
 * 落叶飘落特效 — 纯 CSS @keyframes 实现（感恩节/圣帕特里克节/清明节/世界环境日）。
 * 复用 PetalFallEffect 形态：emoji + rotate 摇摆，零 JS 开销。
 */
export function LeafFallEffect({ intensity }: { intensity: 'low' | 'full' }) {
  const count = intensity === 'full' ? 40 : 20

  const leaves: Leaf[] = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 30}px`,
      fontSize: `${10 + Math.random() * 20}px`,
      animationDuration: `${4 + Math.random() * 6}s`,
      animationDelay: `${Math.random() * 5}s`,
      emoji: LEAVES[Math.floor(Math.random() * LEAVES.length)],
    })),
  [count])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
      {leaves.map((l) => (
        <div
          key={l.id}
          className="absolute"
          style={{
            left: l.left,
            top: l.top,
            fontSize: l.fontSize,
            animation: `leaffall ${l.animationDuration} ease-in ${l.animationDelay} infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          {l.emoji}
        </div>
      ))}
      <style>{`
        @keyframes leaffall {
          0% { transform: translateY(-10vh) translateX(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(50vh) translateX(-30px) rotate(180deg); opacity: 0.9; }
          100% { transform: translateY(110vh) translateX(20px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
