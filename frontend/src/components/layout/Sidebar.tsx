import { CalendarDays, Layers, LogOut, Plus, Search } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import { useCalendarStore } from '../../store/calendarStore'
import { Button } from '@/components/ui/button'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { data: categories } = useCategories()
  const { filterCategoryId, searchKeyword, setFilterCategory, setSearchKeyword, openCreateModal } = useCalendarStore()
  const { username, logout } = useAuthStore()

  return (
    <aside className="w-60 bg-white/80 backdrop-blur border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gray-700" />
          日程管理
        </h1>
      </div>

      <Button
        onClick={() => openCreateModal()}
        className="mx-3 mt-4 rounded-xl"
      >
        <Plus className="w-4 h-4" />
        新建日程
      </Button>

      <div className="px-3 mt-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索日程..."
            className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
            分类
          </p>
          <Button
            variant="ghost"
            onClick={() => setFilterCategory(null)}
            className={cn(
              'w-full justify-start gap-2 px-3',
              !filterCategoryId && 'bg-gray-100 text-gray-900 font-medium'
            )}
          >
            <Layers className="w-4 h-4" />
            全部
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              onClick={() => setFilterCategory(cat.id!)}
              className={cn(
                'w-full justify-start gap-2 px-3',
                filterCategoryId === cat.id && 'bg-gray-100 text-gray-900 font-medium'
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color ?? '#1890ff' }}
              />
              {cat.name}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 truncate">{username}</span>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
