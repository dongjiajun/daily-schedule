import { useState, type FormEvent } from 'react'
import { CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

const API_BASE = '/api/v1/auth'

const dots = [
  { color: '#3b82f6', size: 180, x: '15%', y: '20%', delay: 0 },
  { color: '#10b981', size: 120, x: '80%', y: '15%', delay: 0.15 },
  { color: '#f59e0b', size: 100, x: '75%', y: '75%', delay: 0.3 },
  { color: '#8b5cf6', size: 140, x: '20%', y: '70%', delay: 0.1 },
  { color: '#06b6d4', size: 80, x: '50%', y: '10%', delay: 0.25 },
]

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '请求失败')
      }
      const data = await res.json()
      login(data.token, data.userId, data.username)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #e8ecf1 100%)' }}>

      {/* 彩色装饰光斑 */}
      {dots.map((d, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: d.size,
            height: d.size,
            left: d.x,
            top: d.y,
            background: `radial-gradient(circle, ${d.color}15 0%, ${d.color}03 70%, transparent 100%)`,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: d.delay, ease: 'easeOut' }}
        />
      ))}

      {/* 中心内容 */}
      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md shadow-gray-200/60 border border-gray-100 mb-5"
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <CalendarDays className="w-8 h-8 text-gray-800" />
          </motion.div>
          <motion.h1
            className="text-2xl font-bold text-gray-900 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            日程管理
          </motion.h1>
          <motion.p
            className="text-sm text-gray-500 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isRegister ? '创建新账号开始使用' : '欢迎回来'}
          </motion.p>
        </div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-8 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {error && (
            <motion.div
              className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              用户名
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              密码
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSubmit}
          >
            {loading ? '处理中...' : isRegister ? '创建账号' : '登录'}
          </motion.button>

          <p className="text-center text-sm text-gray-400 pt-1">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="ml-1 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
