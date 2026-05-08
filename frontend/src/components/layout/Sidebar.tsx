import { CalendarDays, Layers, Plus } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import { useCalendarStore } from '../../store/calendarStore'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { data: categories } = useCategories()
  const { filterCategoryId, setFilterCategory, openCreateModal } = useCalendarStore()

  return (
    <aside className="w-60 bg-white/80 backdrop-blur border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gray-700" />
          日程管理
        </h1>
      </div>

      <button
        onClick={openCreateModal}
        className="mx-3 mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        新建日程
      </button>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
            分类
          </p>
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              !filterCategoryId ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Layers className="w-4 h-4" />
            全部
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id!)}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                filterCategoryId === cat.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color ?? '#1890ff' }}
              />
              {cat.name}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}
