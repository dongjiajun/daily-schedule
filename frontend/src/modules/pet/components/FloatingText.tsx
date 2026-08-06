import { motion } from 'framer-motion'
import type { FeedbackItem } from '../store/petStore'

interface FloatingTextProps {
  origin: { x: number; y: number }
  items: FeedbackItem[]
  onDone?: () => void
}

/**
 * 浮动数值反馈 — 从宠物位置向上飘散 + 淡出（1.4s）。
 * 多条数值错开上飘；good 绿 / bad 红。
 */
export function FloatingText({ origin, items, onDone }: FloatingTextProps) {
  if (items.length === 0) return null

  return (
    <div
      className="fixed pointer-events-none"
      style={{ left: origin.x, top: origin.y, zIndex: 100 }}
    >
      {items.map((item, i) => (
        <motion.div
          key={`${item.text}-${i}`}
          initial={{ opacity: 0, y: 0, x: '-50%' }}
          animate={{ opacity: [0, 1, 1, 0], y: -56 - i * 18 }}
          transition={{ duration: 1.4, delay: i * 0.12, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
          onAnimationComplete={i === items.length - 1 ? onDone : undefined}
          className={`absolute whitespace-nowrap text-sm font-semibold drop-shadow-md ${
            item.tone === 'bad' ? 'text-red-400' : 'text-emerald-500'
          }`}
        >
          {item.text}
        </motion.div>
      ))}
    </div>
  )
}
