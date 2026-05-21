import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex h-screen relative"
      style={{ background: 'linear-gradient(145deg, #f4f6f9 0%, #eceff3 50%, #f3f5f8 100%)' }}>
      {/* 微妙网格纹理 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4 relative z-0">
        <div className="h-full bg-white/90 backdrop-blur rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/80 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
