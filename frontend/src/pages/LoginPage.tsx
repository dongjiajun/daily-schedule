import { useState, type FormEvent } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const API_BASE = '/api/v1/auth'

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
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 30%, #f0f2f5 60%, #eef1f5 100%)',
      }}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gray-900/3" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-gray-900/3" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-gray-900/[0.02]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 mb-4">
            <CalendarDays className="w-7 h-7 text-gray-800" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">日程管理</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isRegister ? '创建新账号开始使用' : '欢迎回来'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">用户名</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">密码</label>
            <input
              type="password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:bg-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-gray-900/10"
            onClick={handleSubmit}
          >
            {loading ? '处理中...' : isRegister ? '创建账号' : '登录'}
          </button>

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
        </div>
      </div>
    </div>
  )
}
