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
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            background: '#fff',
            color: '#333',
            padding: '6px 12px',
            borderRadius: 12,
            fontSize: 13,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
