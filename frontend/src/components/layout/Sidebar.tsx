import { CalendarDays, Layers, LogOut, Plus, Search } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import { useCalendarStore } from '../../store/calendarStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '@/components/ui/button'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { data: categories } = useCategories()
  const { filterCategoryId, searchKeyword, setFilterCategory, setSearchKeyword, openCreateModal } = useCalendarStore()
  const { username, logout } = useAuthStore()

  return (
    <aside className="w-60 bg-gradient-to-b from-white to-gray-50/80 border-r border-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-5 py-5">
        <h1 className="text-base font-bold text-gray-900 flex items-center gap-2.5 tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
          日程管理
        </h1>
      </div>

      {/* New event button */}
      <div className="px-4 mb-5">
        <Button
          onClick={() => openCreateModal()}
          className="w-full rounded-xl h-10 shadow-sm shadow-gray-900/5"
        >
          <Plus className="w-4 h-4" />
          新建日程
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索日程..."
            className="w-full rounded-xl border border-gray-200/80 bg-gray-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        <p className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
          分类
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
              !filterCategoryId
                ? 'bg-gray-900/5 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-100/70'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            全部
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id!)}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                filterCategoryId === cat.id
                  ? 'bg-gray-900/5 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-100/70'
              )}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-gray-200/50"
                style={{ backgroundColor: cat.color ?? '#1890ff' }}
              />
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-4 py-3.5 border-t border-gray-100/80">
        <div
          className="flex items-center justify-between group cursor-pointer py-1"
          onClick={logout}
        >
          <span className="text-[13px] text-gray-400 truncate group-hover:text-gray-600 transition-colors">
            {username}
          </span>
          <LogOut className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </aside>
  )
}
