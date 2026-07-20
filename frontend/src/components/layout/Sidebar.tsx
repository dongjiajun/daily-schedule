import dayjs from 'dayjs'
import {
  CalendarDays, Download, HelpCircle, Keyboard, Layers, LogOut, Plus, Search, Settings, Tag as TagIcon, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCategories } from '@/hooks/useCategories'
import { useTags } from '@/hooks/useTags'
import { useEvents } from '@/hooks/useEvents'
import { useCalendarStore } from '@/store/calendarStore'
import { useAuthStore } from '@/core/store/authStore'
import { downloadICS } from '@/core/lib/ics'
import { Button } from '@/core/components/ui/button'
import { cn } from '@/core/lib/utils'

function WeekStats() {
  const { data: weekEvents } = useEvents(dayjs(), 'week')
  const events = weekEvents ?? []
  const today = events.filter((e) => dayjs(e.startTime).isSame(dayjs(), 'day'))
  const completed = events.filter((e) => e.status === 'COMPLETED')
  const rate = events.length > 0 ? Math.round((completed.length / events.length) * 100) : 0

  return (
    <div className="mx-4 mb-3 rounded-xl border border-border-subtle bg-surface/70 p-3 space-y-2">
      <div className="flex items-center justify-between text-[12px] text-foreground-muted">
        <span>今日 <span className="font-semibold text-foreground">{today.length}</span> 项</span>
        <span>本周 <span className="font-semibold text-foreground">{events.length}</span> 项</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span>本周完成率</span>
          <span className="font-medium text-foreground-secondary">{rate}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500/80 transition-all duration-500"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: categories } = useCategories()
  const { data: tags } = useTags()
  const {
    currentDate, view,
    filterCategoryId, filterTagId, searchKeyword,
    setFilterCategory, setFilterTag, setSearchKeyword,
    openCreateModal, openOnboarding, openManage, setShowShortcuts,
  } = useCalendarStore()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { data: visibleEvents } = useEvents(currentDate, view, {
    categoryId: filterCategoryId,
    tagId: filterTagId,
    keyword: searchKeyword,
  })

  const handleExport = () => {
    const events = visibleEvents ?? []
    if (events.length === 0) {
      toast.info('当前视图没有可导出的日程')
      return
    }
    downloadICS(events, `schedule-${currentDate.format('YYYY-MM-DD')}.ics`)
    toast.success(`已导出 ${events.length} 条日程（.ics）`)
  }

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

      {/* New event button */}
      <div className="px-4 mt-4 mb-4">
        <Button
          onClick={() => { openCreateModal(); onNavigate?.() }}
          className="w-full rounded-xl h-10 shadow-sm font-medium transition-all duration-200 hover:shadow-md"
          title="新建日程（N）"
        >
          <Plus className="w-4 h-4" />
          新建日程
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <input
            id="sidebar-search"
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索日程...（/）"
            className="w-full rounded-xl border border-border bg-sidebar-muted pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-focus-strong/10 focus:border-border focus:bg-surface transition-all duration-200 placeholder:text-foreground-muted"
          />
        </div>
      </div>

      {/* Filters */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {/* Categories */}
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-widest">分类</p>
          <button
            onClick={() => openManage('categories')}
            className="w-5 h-5 rounded-md flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-hover transition-all"
            title="管理分类"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-0.5">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
              !filterCategoryId
                ? 'bg-accent/5 text-foreground font-medium shadow-sm'
                : 'text-foreground-secondary hover:bg-hover'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            全部
          </button>
          {categories && categories.length > 0 ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(filterCategoryId === cat.id ? null : cat.id!)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  filterCategoryId === cat.id
                    ? 'bg-accent/5 text-foreground font-medium shadow-sm'
                    : 'text-foreground-secondary hover:bg-hover'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-border/50"
                  style={{ backgroundColor: cat.color ?? '#3b82f6' }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-foreground-muted px-3 py-3 text-center">
              暂无分类，点击上方 <span className="text-foreground-muted font-medium">+</span> 创建
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between px-3 py-2 mt-3">
          <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-widest">标签</p>
          <button
            onClick={() => openManage('tags')}
            className="w-5 h-5 rounded-md flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-hover transition-all"
            title="管理标签"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {tags.map((tag) => {
              const active = filterTagId === tag.id
              return (
                <button
                  key={tag.id}
                  onClick={() => setFilterTag(active ? null : tag.id!)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all',
                    active ? 'shadow-sm font-medium' : 'opacity-75 hover:opacity-100'
                  )}
                  style={{
                    backgroundColor: active ? (tag.color ?? '#3b82f6') + '22' : 'var(--color-sidebar-muted)',
                    borderColor: active ? (tag.color ?? '#3b82f6') : 'var(--color-border)',
                    color: 'var(--color-foreground-secondary)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color ?? '#3b82f6' }} />
                  {tag.name}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-foreground-muted px-3 pb-3 flex items-center gap-1.5">
            <TagIcon className="w-3 h-3" />
            暂无标签
          </p>
        )}
      </nav>

      {/* Week stats */}
      <WeekStats />

      {/* Footer */}
      <div className="px-4 py-3.5 border-t border-border-subtle space-y-1">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <button
            onClick={() => openManage('preferences')}
            className="flex items-center gap-2 text-[13px] text-foreground-muted hover:text-foreground-secondary transition-colors py-1"
            title="偏好设置"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>设置</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-[13px] text-foreground-muted hover:text-foreground-secondary transition-colors py-1"
            title="把当前视图的日程导出为 .ics 文件"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出</span>
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-2 text-[13px] text-foreground-muted hover:text-foreground-secondary transition-colors py-1"
            title="键盘快捷键（?）"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>快捷键</span>
          </button>
          <button
            onClick={openOnboarding}
            className="flex items-center gap-2 text-[13px] text-foreground-muted hover:text-foreground-secondary transition-colors py-1"
            title="查看使用指南"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>指南</span>
          </button>
        </div>
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
