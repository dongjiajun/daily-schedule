import { useState } from 'react'
import { CalendarDays, HelpCircle, Layers, LogOut, Plus, Search, X } from 'lucide-react'
import { useCategories, useCreateCategory } from '../../hooks/useCategories'
import { useCalendarStore } from '../../store/calendarStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '@/components/ui/button'
import { cn } from '../../lib/utils'
import type { CategoryCreateRequest } from '../../api/types.gen'

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#84cc16']

export function Sidebar() {
  const { data: categories } = useCategories()
  const { filterCategoryId, searchKeyword, setFilterCategory, setSearchKeyword, openCreateModal, openOnboarding } = useCalendarStore()
  const { username, logout } = useAuthStore()
  const createCategory = useCreateCategory()

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')

  const handleCreate = () => {
    if (!newName.trim()) return
    const data: CategoryCreateRequest = { name: newName.trim(), color: newColor }
    createCategory.mutate(data, {
      onSuccess: () => {
        setNewName('')
        setShowForm(false)
      },
    })
  }

  return (
    <aside className="w-60 bg-gradient-to-b from-white via-white to-gray-50/70 border-r border-gray-100/80 flex flex-col relative z-10">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100/80">
        <h1 className="text-[15px] font-bold text-gray-900 flex items-center gap-2.5 tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-sm shadow-gray-900/15">
            <CalendarDays className="w-4 h-4" />
          </div>
          日程管理
        </h1>
      </div>

      {/* New event button */}
      <div className="px-4 mt-4 mb-4">
        <Button
          onClick={() => openCreateModal()}
          className="w-full rounded-xl h-10 shadow-sm shadow-gray-900/8 font-medium transition-all duration-200 hover:shadow-md hover:shadow-gray-900/12"
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
            className="w-full rounded-xl border border-gray-200/80 bg-gray-50/80 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">分类</p>
          <button
            onClick={() => { setShowForm(!showForm); setNewName('') }}
            className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all',
              showForm && 'bg-gray-100 text-gray-700'
            )}
          >
            {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>

        {/* New category form */}
        {showForm && (
          <div className="px-3 pb-3 space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="分类名称"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    newColor === color && 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button size="sm" className="w-full h-7 text-xs rounded-lg" onClick={handleCreate} disabled={createCategory.isPending}>
              {createCategory.isPending ? '创建中...' : '添加分类'}
            </Button>
          </div>
        )}

        <div className="space-y-0.5">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
              !filterCategoryId
                ? 'bg-gray-900/5 text-gray-900 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100/70'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            全部
          </button>
          {categories && categories.length > 0 ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id!)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  filterCategoryId === cat.id
                    ? 'bg-gray-900/5 text-gray-900 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100/70'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-gray-200/50"
                  style={{ backgroundColor: cat.color ?? '#3b82f6' }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400 px-3 py-3 text-center">
              暂无分类，点击上方 <span className="text-gray-500 font-medium">+</span> 创建
            </p>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-4 py-3.5 border-t border-gray-100/80 space-y-2">
        <button
          onClick={openOnboarding}
          className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors w-full"
          title="查看使用指南"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>使用指南</span>
        </button>
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
