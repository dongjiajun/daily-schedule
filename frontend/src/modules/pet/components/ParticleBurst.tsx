import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ParticleType } from '../store/petStore'

interface ParticleBurstProps {
  origin: { x: number; y: number }
  type: ParticleType
  count?: number
  onDone?: () => void
}

interface ParticleData {
  id: number
  angle: number
  distance: number
  delay: number
  duration: number
  emoji: string
}

const EMOJI_MAP: Record<ParticleType, string[]> = {
  hearts: ['❤️', '💕', '💖', '💗'],
  stars: ['⭐', '🌟', '✨', '💫'],
  coins: ['🪙', '💰', '💎'],
  sparkles: ['✨', '⚡', '💥', '🔥'],
}

/** 使用种子生成伪随机数（避免 Math.random() 在 render 中被 ESLint 拒绝） */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/**
 * 粒子爆发组件 — 从 origin 发射粒子向随机方向移动+淡出。
 * 用于宠物互动反馈。
 */
export function ParticleBurst({ origin, type, count = 8, onDone }: ParticleBurstProps) {
  const particles: ParticleData[] = useMemo(() => {
    const emojis = EMOJI_MAP[type]
    return Array.from({ length: count }, (_, i) => {
      const baseSeed = i * 137 + count * 271
      return {
        id: i,
        angle: (Math.PI * 2 * i) / count + (seededRandom(baseSeed) - 0.5) * 0.5,
        distance: 40 + seededRandom(baseSeed + 1) * 60,
        delay: seededRandom(baseSeed + 2) * 0.1,
        duration: 1.2 + seededRandom(baseSeed + 3) * 0.5,
        emoji: emojis[i % emojis.length],
      }
    })
  }, [type, count])

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: origin.x,
        top: origin.y,
        zIndex: 100,
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute text-lg"
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance - 20,
            opacity: 0,
            scale: [0, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
          onAnimationComplete={p.id === particles.length - 1 ? onDone : undefined}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}
