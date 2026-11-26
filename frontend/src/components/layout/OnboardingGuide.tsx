import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Calendar, Search, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'

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

export function OnboardingGuide({ open = true, onClose }: { open?: boolean; onClose: () => void }) {
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
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent showClose={false} className="max-w-md p-10 text-center">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-hover text-foreground-muted hover:text-foreground-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-hover"
            style={{ color: current.color }}
          >
            <current.icon className="w-8 h-8" />
          </div>

          <DialogTitle className="text-xl font-bold text-foreground mb-2 tracking-tight">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground-secondary leading-relaxed mb-8">
            {current.desc}
          </DialogDescription>
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
            <Button variant="outline" className="flex-1" onClick={onClose}>
              跳过
            </Button>
          )}
          {/* 下一步/开始按钮 */}
          <Button className="flex-1 shadow-card" onClick={handleNext}>
            {isLast ? '开始使用' : '下一步'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
