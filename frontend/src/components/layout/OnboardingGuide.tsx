import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, Search, X } from 'lucide-react'

const STEPS = [
  {
    title: '欢迎使用日程管理',
    desc: '只需 3 步，轻松管理你的每一天。',
    icon: Calendar,
    color: '#1a1a2e',
  },
  {
    title: '创建你的第一个日程',
    desc: '点击左侧「新建日程」按钮，或按键盘 N 键快速创建。',
    icon: Plus,
    color: '#3b82f6',
  },
  {
    title: '拖拽或点击调整',
    desc: '点击日程可编辑或删除，按分类和关键词快速筛选。',
    icon: Search,
    color: '#10b981',
  },
]

export function OnboardingGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else onClose()
  }, [step, onClose])

  const current = STEPS[step]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={next}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md mx-4 text-center relative"
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{ backgroundColor: current.color + '10', color: current.color }}
            >
              <current.icon className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
              {current.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              {current.desc}
            </p>
          </motion.div>

          {/* 步骤点 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${
                  i === step ? 'w-6 h-2 bg-gray-900' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"
          >
            {step < STEPS.length - 1 ? '下一步' : '开始使用'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
