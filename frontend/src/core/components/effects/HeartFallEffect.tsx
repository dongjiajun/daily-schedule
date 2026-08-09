/* eslint-disable react-hooks/purity -- useMemo wraps Math.random(), stable per count change */

import { useMemo } from 'react'

interface Heart {
  id: number
  left: string
  top: string
  fontSize: string
  animationDuration: string
  animationDelay: string
  emoji: string
}

const HEARTS = ['💖', '💕', '❤️', '💘']

/**
 * 爱心飘落特效 — 纯 CSS @keyframes 实现（情人节）。
 * 复用 PetalFallEffect 形态：emoji + rotate 摇摆，零 JS 开销。
 */
export function HeartFallEffect({ intensity }: { intensity: 'low' | 'full' }) {
  const count = intensity === 'full' ? 40 : 20

  const hearts: Heart[] = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 30}px`,
      fontSize: `${10 + Math.random() * 20}px`,
      animationDuration: `${4 + Math.random() * 6}s`,
      animationDelay: `${Math.random() * 5}s`,
      emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
    })),
  [count])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute"
          style={{
            left: h.left,
            top: h.top,
            fontSize: h.fontSize,
            animation: `heartfall ${h.animationDuration} ease-in ${h.animationDelay} infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          {h.emoji}
        </div>
      ))}
      <style>{`
        @keyframes heartfall {
          0% { transform: translateY(-10vh) translateX(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(50vh) translateX(30px) rotate(180deg); opacity: 0.9; }
          100% { transform: translateY(110vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
