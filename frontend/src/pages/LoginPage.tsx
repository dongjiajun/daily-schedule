import { useState, type FormEvent } from 'react'
import { CalendarDays, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { login as loginApi, register as registerApi } from '../api/sdk.gen'

const dots = [
  { color: '#3b82f6', size: 200, x: '12%', y: '18%', delay: 0, duration: 6 },
  { color: '#10b981', size: 140, x: '82%', y: '12%', delay: 0.15, duration: 7 },
  { color: '#f59e0b', size: 110, x: '78%', y: '78%', delay: 0.3, duration: 5.5 },
  { color: '#8b5cf6', size: 160, x: '18%', y: '72%', delay: 0.1, duration: 6.5 },
  { color: '#06b6d4', size: 90, x: '52%', y: '8%', delay: 0.25, duration: 5 },
]

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginFromResponse = useAuthStore((s) => s.loginFromResponse)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        const resp = await registerApi({
          body: {
            username,
            email,
            password,
            displayName: username,
          },
        })
        if (resp.error) throw new Error(extractMessage(resp.error) ?? '注册失败')
        if (resp.data) loginFromResponse(resp.data)
      } else {
        const resp = await loginApi({
          body: {
            usernameOrEmail: username,
            password,
          },
        })
        if (resp.error) throw new Error(extractMessage(resp.error) ?? '登录失败')
        if (resp.data) loginFromResponse(resp.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, var(--color-gradient-from) 0%, var(--color-gradient-via) 40%, var(--color-gradient-to) 100%)' }}>

      {/* 网格纹理背景 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-grid-dot) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* 彩色光斑 — 浮动 + 呼吸 */}
      {dots.map((d, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: d.size,
            height: d.size,
            left: d.x,
            top: d.y,
            background: `radial-gradient(circle, ${d.color}18 0%, ${d.color}04 60%, transparent 100%)`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 0.7, 1],
            scale: [0.5, 1, 1.05, 1],
            x: [0, 12, -8, 0],
            y: [0, -10, 6, 0],
          }}
          transition={{
            opacity: { duration: 1.2, delay: d.delay, ease: 'easeOut' },
            scale: { duration: 1.2, delay: d.delay, ease: 'easeOut' },
            x: { duration: d.duration, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' },
            y: { duration: d.duration * 0.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse', delay: 1 },
          }}
        />
      ))}

      {/* 中心内容 */}
      <motion.div
        className="w-full max-w-sm relative z-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface shadow-lg border border-border-subtle mb-5"
            whileHover={{ rotate: -8, scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <CalendarDays className="w-8 h-8 text-foreground" />
          </motion.div>
          <motion.h1
            className="text-2xl font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            日程管理
          </motion.h1>
          <motion.p
            className="text-sm text-foreground-muted mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isRegister ? '创建新账号开始使用' : '欢迎回来'}
          </motion.p>
        </div>

        <motion.div
          className="bg-surface rounded-2xl shadow-xl border border-border-subtle p-8 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5 uppercase tracking-wider">
              {isRegister ? '用户名' : '用户名 / 邮箱'}
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-sidebar-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-focus-strong/10 focus:border-focus transition-all duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRegister ? '3-50 位字母/数字/下划线' : '输入用户名或邮箱'}
              required
              autoFocus
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5 uppercase tracking-wider">
                邮箱
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-sidebar-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-focus-strong/10 focus:border-focus transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5 uppercase tracking-wider">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-xl border border-border px-4 py-3 pr-11 text-sm bg-sidebar-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-focus-strong/10 focus:border-focus transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? '至少 8 位' : '输入密码'}
                required
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                minLength={isRegister ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-accent-fg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 50%, var(--color-accent) 100%)',
            }}
            whileHover={{ scale: loading ? 1 : 1.015, boxShadow: '0 8px 25px rgba(15, 23, 42, 0.2)' }}
            whileTap={{ scale: loading ? 1 : 0.985 }}
            onClick={handleSubmit}
          >
            <span className="relative z-10">
              {loading ? '处理中...' : isRegister ? '创建账号' : '登录'}
            </span>
          </motion.button>

          <p className="text-center text-sm text-foreground-muted pt-1">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="ml-1 text-foreground-secondary font-medium hover:text-foreground transition-colors"
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

function extractMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message
    return typeof m === 'string' ? m : null
  }
  return null
}
