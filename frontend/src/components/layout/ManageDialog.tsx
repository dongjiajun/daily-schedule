import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCalendarStore, type CalendarView } from '@/store/calendarStore'
import { useSettingsStore, type ThemePreset, THEME_LABELS, THEME_COLORS } from '@/store/settingsStore'
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '@/hooks/useCategories'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags'
import { cn } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/colors'

const VIEW_LABELS: Record<CalendarView, string> = { month: '月', week: '周', day: '日', agenda: '议程' }

const REMINDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'none', label: '不提醒' },
  { value: '0', label: '事件开始时' },
  { value: '15', label: '15 分钟前' },
  { value: '30', label: '30 分钟前' },
  { value: '60', label: '1 小时前' },
  { value: '1440', label: '1 天前' },
]

const DURATION_OPTIONS = [30, 60, 90, 120]

interface EditableItem {
  id?: number
  name?: string
  color?: string
}

interface ItemListProps {
  items: EditableItem[]
  emptyText: string
  placeholder: string
  maxLength: number
  pendingCreate: boolean
  onCreate: (name: string, color: string) => void
  onUpdate: (id: number, name: string, color: string) => void
  onDelete: (id: number) => void
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-5 h-5 rounded-full transition-all',
            value === color && 'ring-2 ring-offset-1 ring-focus scale-110'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function ItemList({ items, emptyText, placeholder, maxLength, pendingCreate, onCreate, onUpdate, onDelete }: ItemListProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(PRESET_COLORS[0])
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreate(newName.trim(), newColor)
    setNewName('')
  }

  const startEdit = (item: EditableItem) => {
    setEditingId(item.id!)
    setEditName(item.name ?? '')
    setEditColor(item.color ?? PRESET_COLORS[0])
    setDeletingId(null)
  }

  const submitEdit = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, editName.trim(), editColor)
      setEditingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* 新建 */}
      <div className="rounded-xl border border-border-subtle bg-sidebar-muted p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="h-8 text-sm bg-white"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button size="sm" className="h-8 rounded-lg" onClick={handleCreate} disabled={pendingCreate || !newName.trim()}>
            <Plus className="w-3.5 h-3.5" />
            添加
          </Button>
        </div>
        <ColorPicker value={newColor} onChange={setNewColor} />
      </div>

      {/* 列表 */}
      <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="text-xs text-foreground-muted text-center py-6">{emptyText}</p>
        )}
        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="rounded-lg border border-border p-2.5 space-y-2 bg-surface">
              <div className="flex gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={maxLength}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                />
                <Button size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={submitEdit}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => setEditingId(null)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
          ) : (
            <div
              key={item.id}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-hover transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color ?? '#3b82f6' }} />
              <span className="flex-1 text-sm text-foreground-secondary truncate">{item.name}</span>
              {deletingId === item.id ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] text-red-500">确认删除？</span>
                  <Button size="sm" variant="destructive" className="h-6 px-2 text-[11px] rounded-md" onClick={() => { onDelete(item.id!); setDeletingId(null) }}>
                    删除
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] rounded-md" onClick={() => setDeletingId(null)}>
                    取消
                  </Button>
                </span>
              ) : (
                <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 rounded-md text-foreground-muted hover:text-foreground-secondary hover:bg-hover transition-colors"
                    onClick={() => startEdit(item)}
                    title="编辑"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-md text-foreground-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => { setDeletingId(item.id!); setEditingId(null) }}
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export function ManageDialog() {
  const showManage = useCalendarStore((s) => s.showManage)
  const manageTab = useCalendarStore((s) => s.manageTab)
  const closeManage = useCalendarStore((s) => s.closeManage)
  const openManage = useCalendarStore((s) => s.openManage)

  const { data: categories } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const { data: tags } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const settings = useSettingsStore()

  return (
    <Dialog open={showManage} onOpenChange={(o) => { if (!o) closeManage() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>管理与偏好</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <Tabs value={manageTab} onValueChange={(v) => openManage(v as 'categories' | 'tags' | 'preferences')}>
            <TabsList className="w-full">
              <TabsTrigger value="categories" className="flex-1">分类</TabsTrigger>
              <TabsTrigger value="tags" className="flex-1">标签</TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1">偏好设置</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="mt-4">
              <ItemList
                items={categories ?? []}
                emptyText="暂无分类"
                placeholder="分类名称"
                maxLength={50}
                pendingCreate={createCategory.isPending}
                onCreate={(name, color) => createCategory.mutate({ name, color })}
                onUpdate={(id, name, color) => updateCategory.mutate({ id, data: { name, color } })}
                onDelete={(id) => deleteCategory.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <ItemList
                items={tags ?? []}
                emptyText="暂无标签，添加后可在日程表单中打标"
                placeholder="标签名称"
                maxLength={30}
                pendingCreate={createTag.isPending}
                onCreate={(name, color) => createTag.mutate({ name, color })}
                onUpdate={(id, name, color) => updateTag.mutate({ id, data: { name, color } })}
                onDelete={(id) => deleteTag.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="preferences" className="mt-4 space-y-5">
              <div className="space-y-1.5">
                <Label>默认视图</Label>
                <Select value={settings.defaultView} onValueChange={(v) => settings.setDefaultView(v as CalendarView)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
                      <SelectItem key={v} value={v}>{VIEW_LABELS[v]}视图</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-foreground-muted">下次打开应用时生效</p>
              </div>

              <div className="space-y-1.5">
                <Label>新日程默认提醒</Label>
                <Select
                  value={settings.defaultReminderMinutes === null ? 'none' : String(settings.defaultReminderMinutes)}
                  onValueChange={(v) => settings.setDefaultReminderMinutes(v === 'none' ? null : Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>快速新建默认时长</Label>
                <Select
                  value={String(settings.defaultDurationMinutes)}
                  onValueChange={(v) => settings.setDefaultDurationMinutes(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((m) => (
                      <SelectItem key={m} value={String(m)}>{m >= 60 ? `${m / 60} 小时` : `${m} 分钟`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label className="cursor-pointer" htmlFor="show-completed">显示已完成日程</Label>
                  <p className="text-[11px] text-foreground-muted mt-0.5">关闭后日历上隐藏已完成/已取消的日程</p>
                </div>
                <Switch
                  id="show-completed"
                  checked={settings.showCompleted}
                  onCheckedChange={settings.setShowCompleted}
                />
              </div>

              <div className="space-y-1.5">
                <Label>主题配色</Label>
                <Select value={settings.theme} onValueChange={(v) => settings.setTheme(v as ThemePreset)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(THEME_LABELS) as ThemePreset[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: THEME_COLORS[t] }} />
                          {THEME_LABELS[t]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-foreground-muted">切换后即时生效，自动保存</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
