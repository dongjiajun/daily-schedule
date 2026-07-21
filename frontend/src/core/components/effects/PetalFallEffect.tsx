/* eslint-disable react-hooks/purity -- useMemo wraps Math.random(), stable per count change */

import { useMemo } from 'react'

interface Petal {
  id: number
  left: string
  top: string
  fontSize: string
  animationDuration: string
  animationDelay: string
  emoji: string
}

const PETALS = ['🌸', '💮', '🌺', '✿', '🌷']

/**
 * 花瓣飘落特效 — 纯 CSS @keyframes 实现。
 */
export function PetalFallEffect({ intensity }: { intensity: 'low' | 'full' }) {
  const count = intensity === 'full' ? 40 : 20

  const petals: Petal[] = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 30}px`,
      fontSize: `${10 + Math.random() * 20}px`,
      animationDuration: `${4 + Math.random() * 6}s`,
      animationDelay: `${Math.random() * 5}s`,
      emoji: PETALS[Math.floor(Math.random() * PETALS.length)],
    })),
  [count])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.fontSize,
            animation: `petalfall ${p.animationDuration} ease-in ${p.animationDelay} infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          {p.emoji}
        </div>
      ))}
      <style>{`
        @keyframes petalfall {
          0% { transform: translateY(-10vh) translateX(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(50vh) translateX(30px) rotate(180deg); opacity: 0.9; }
          100% { transform: translateY(110vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
