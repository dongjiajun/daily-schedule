import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calendar, Search, X } from 'lucide-react'

const STEPS = [
  {
    title: '欢迎使用日程管理',
    desc: '只需 3 步，轻松管理你的每一天。',
    icon: Calendar,
    color: 'var(--color-foreground)',
  },
  {
    title: '创建你的第一个日程',
    desc: '点击左侧「新建日程」按钮、框选日历空白时段，或按键盘 N 键快速创建。',
    icon: Plus,
    color: 'var(--color-info)',
  },
  {
    title: '拖拽调整 · 一键完成',
    desc: '直接拖动日程改期、拉伸边缘调时长；悬停日程点击圆圈标记完成。按 ? 查看全部快捷键。',
    icon: Search,
    color: 'var(--color-success)',
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
        className="bg-surface rounded-3xl shadow-2xl p-10 max-w-md mx-4 text-center relative"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-hover text-foreground-muted hover:text-foreground-secondary transition-colors"
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

          <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm text-foreground-secondary leading-relaxed mb-8">
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
                  ? 'w-6 h-2 bg-accent'
                  : 'w-2 h-2 bg-hover hover:bg-border'
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
              className="flex-1 py-3 rounded-xl border border-border text-sm text-foreground-secondary hover:bg-hover transition-colors"
            >
              跳过
            </button>
          )}
          {/* 下一步/开始按钮 */}
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm"
          >
            {isLast ? '开始使用' : '下一步'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
