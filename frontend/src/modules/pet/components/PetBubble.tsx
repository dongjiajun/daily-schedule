import { AnimatePresence, motion } from 'framer-motion'
import { usePetStore } from '../store/petStore'

export function PetBubble() {
  const message = usePetStore((s) => s.bubbleMessage)

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl text-[13px] whitespace-nowrap pointer-events-none z-50 shadow-lg bg-surface/95 backdrop-blur text-foreground"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
