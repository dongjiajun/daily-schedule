import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, LogOut, X } from 'lucide-react'
import { useAuthStore } from '@/core/store/authStore'
import { moduleRegistry } from '@/core/lib/moduleRegistry'

/**
 * 通用 Sidebar Shell：
 * - 顶部：Logo + 模块导航按钮
 * - 中部：当前活跃模块的 sidebarComponent
 * - 底部：用户信息 + 登出
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const modules = moduleRegistry.getAll()

  // 根据当前路由匹配活跃模块
  const activeModule = modules.find((m) =>
    m.routes.some((r) => {
      if (r.index) return location.pathname === '/'
      if (r.path) return location.pathname.startsWith(`/${r.path}`)
      return false
    })
  )

  const ActiveSidebarComponent = activeModule?.sidebarComponent

  return (
    <aside className="w-60 h-full bg-gradient-to-b from-surface via-surface to-sidebar-muted border-r border-border-subtle flex flex-col relative z-10">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
        <h1 className="text-[15px] font-bold text-foreground flex items-center gap-2.5 tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-accent text-accent-fg flex items-center justify-center shadow-sm">
            <CalendarDays className="w-4 h-4" />
          </div>
          日程管理
        </h1>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="md:hidden p-1.5 rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-hover transition-colors"
            aria-label="关闭侧边栏"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Module navigation */}
      {modules.length > 1 && (
        <div className="px-3 py-2 border-b border-border-subtle">
          <div className="flex gap-1">
            {modules.map((m) => {
              const isActive = m.id === activeModule?.id
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    const defaultRoute = m.routes[0]
                    if (defaultRoute?.index) {
                      navigate('/')
                    } else if (defaultRoute?.path) {
                      navigate(`/${defaultRoute.path}`)
                    }
                    onNavigate?.()
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-accent/10 text-foreground font-medium'
                      : 'text-foreground-muted hover:bg-hover hover:text-foreground-secondary'
                  }`}
                  title={m.name}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{m.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Active module sidebar content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {ActiveSidebarComponent ? (
          <ActiveSidebarComponent onNavigate={onNavigate} />
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Footer — User + Logout */}
      <div className="px-4 py-3.5 border-t border-border-subtle">
        <div
          className="flex items-center justify-between group cursor-pointer py-1"
          onClick={logout}
          title="退出登录"
        >
          <span className="text-[13px] text-foreground-muted truncate group-hover:text-foreground-secondary transition-colors">
            {user?.displayName ?? user?.username ?? '未登录'}
          </span>
          <LogOut className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-secondary transition-colors" />
        </div>
      </div>
    </aside>
  )
}
