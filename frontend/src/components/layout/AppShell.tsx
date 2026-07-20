import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { ShortcutsDialog } from './ShortcutsDialog'
import { useCalendarStore } from '@/modules/calendar/store/calendarStore'

export function AppShell() {
  const sidebarOpen = useCalendarStore((s) => s.sidebarOpen)
  const setSidebarOpen = useCalendarStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-screen relative"
      style={{ background: 'linear-gradient(145deg, var(--color-gradient-from) 0%, var(--color-gradient-via) 50%, var(--color-gradient-to) 100%)' }}>
      {/* 微妙网格纹理 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-grid-dot) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* 桌面端固定侧边栏 */}
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {/* 移动端抽屉侧边栏 */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-overlay backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-40 md:hidden"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden p-4 relative z-0">
        <div className="h-full bg-surface/90 backdrop-blur rounded-2xl shadow-lg border border-border-subtle overflow-hidden relative">
          {/* 移动端打开侧边栏按钮 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute left-3 bottom-3 z-20 w-11 h-11 rounded-full bg-accent text-accent-fg shadow-lg flex items-center justify-center"
            aria-label="打开侧边栏"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Outlet />
        </div>
      </main>

      <ShortcutsDialog />
    </div>
  )
}
