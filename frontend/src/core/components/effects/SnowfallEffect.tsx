/* eslint-disable react-hooks/purity -- useMemo wraps Math.random(), stable per count change */

import { useMemo } from 'react'

interface Snowflake {
  id: number
  left: string
  top: string
  fontSize: string
  animationDuration: string
  animationDelay: string
}

/**
 * 雪花飘落特效 — 纯 CSS @keyframes 实现。
 * 零 JS 开销，GPU 合成，适合移动端。
 */
export function SnowfallEffect({ intensity }: { intensity: 'low' | 'full' }) {
  const count = intensity === 'full' ? 50 : 25

  const flakes: Snowflake[] = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 20}px`,
      fontSize: `${8 + Math.random() * 16}px`,
      animationDuration: `${3 + Math.random() * 5}s`,
      animationDelay: `${Math.random() * 5}s`,
    })),
  [count])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute text-white opacity-80"
          style={{
            left: f.left,
            top: f.top,
            fontSize: f.fontSize,
            animation: `snowfall ${f.animationDuration} linear ${f.animationDelay} infinite`,
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
