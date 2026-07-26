import { useState } from 'react'
import { motion } from 'framer-motion'
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
    desc: '点击左侧「新建日程」按钮、框选日历空白时段，或按键盘 N 键快速创建。',
    icon: Plus,
    color: '#3b82f6',
  },
  {
    title: '拖拽调整 · 一键完成',
    desc: '直接拖动日程改期、拉伸边缘调时长；悬停日程点击圆圈标记完成。按 ? 查看全部快捷键。',
    icon: Search,
    color: '#10b981',
  },
]

export function OnboardingGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step >= STEPS.length - 1

  function handleNext() {
    if (isLast) {
      onClose()
    } else {
      setStep(step + 1)
    }
  }

  const current = STEPS[step]

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md mx-4 text-center relative"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="关闭引导"
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
            style={{ backgroundColor: current.color + '15', color: current.color }}
          >
            <current.icon className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
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
                i === step
                  ? 'w-6 h-2 bg-blue-500'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`步骤 ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {/* 跳过按钮 */}
          {!isLast && (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              跳过
            </button>
          )}
          {/* 下一步/开始按钮 */}
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
          >
            {isLast ? '开始使用' : '下一步'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
