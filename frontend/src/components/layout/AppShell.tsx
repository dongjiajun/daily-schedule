import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex h-screen"
      style={{ background: 'linear-gradient(135deg, #f5f6f8 0%, #edeff3 100%)' }}>
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full bg-white rounded-2xl shadow-sm shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
