import { useState, type FormEvent } from 'react'
import dayjs from 'dayjs'
import type { EventResponse, CategoryResponse, TagResponse } from '@/api/types.gen'
import { useCalendarStore } from '../store/calendarStore'
import { useSettingsStore } from '@/core/store/settingsStore'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { Textarea } from '@/core/components/ui/textarea'
import { Switch } from '@/core/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select'
import { cn } from '@/core/lib/utils'
import { PRESET_COLORS } from '@daily-schedule/shared'
import { ChevronDown } from 'lucide-react'

export interface EventFormValues {
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay: boolean
  location?: string
  color?: string
  reminderMinutes?: number
  categoryId?: number
  tagIds?: number[]
}

interface EventFormProps {
  initialValues?: EventResponse
  categories: CategoryResponse[]
  tags: TagResponse[]
  onSubmit: (values: EventFormValues) => void
  loading?: boolean
}

const NO_CATEGORY = '__none__'
const NO_REMINDER = '__none__'
const REMINDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: NO_REMINDER, label: '不提醒' },
  { value: '0', label: '事件开始时' },
  { value: '15', label: '15 分钟前' },
  { value: '30', label: '30 分钟前' },
  { value: '60', label: '1 小时前' },
  { value: '1440', label: '1 天前' },
]

function toInputValue(iso: string | undefined, allDay: boolean): string {
  if (!iso) return ''
  return allDay ? iso.slice(0, 10) : iso.slice(0, 16)
}

function toSubmitTime(value: string, allDay: boolean): string {
  if (!value) return ''
  return allDay ? `${value}T00:00:00` : `${value}:00`
}

/** 未框选时段时的兜底：下一个整点/半点开始，时长取用户偏好。 */
function smartDefaults(durationMinutes: number) {
  const now = dayjs()
  const start = now.minute() < 30 ? now.minute(30).second(0) : now.add(1, 'hour').minute(0).second(0)
  return {
    start: start.format('YYYY-MM-DDTHH:mm'),
    end: start.add(durationMinutes, 'minute').format('YYYY-MM-DDTHH:mm'),
  }
}

export function EventForm({ initialValues, categories, tags, onSubmit, loading }: EventFormProps) {
  const storeStart = useCalendarStore((s) => s.defaultStart)
  const storeEnd = useCalendarStore((s) => s.defaultEnd)
  const defaultReminder = useSettingsStore((s) => s.defaultReminderMinutes)
  const defaultDuration = useSettingsStore((s) => s.defaultDurationMinutes)

  const [smart] = useState(() => smartDefaults(defaultDuration))
  const defaultStart = storeStart ?? (initialValues ? null : smart.start)
  const defaultEnd = storeEnd ?? (initialValues ? null : smart.end)

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [startTime, setStartTime] = useState(
    toInputValue(initialValues?.startTime, initialValues?.allDay ?? false) || defaultStart || ''
  )
  const [endTime, setEndTime] = useState(
    toInputValue(initialValues?.endTime, initialValues?.allDay ?? false) || defaultEnd || ''
  )
  const [allDay, setAllDay] = useState(initialValues?.allDay ?? false)
  const [location, setLocation] = useState(initialValues?.location ?? '')
  const [color, setColor] = useState(
    initialValues?.categoryId ? (initialValues?.categoryColor ?? initialValues?.color ?? '#3b82f6') : (initialValues?.color ?? '#3b82f6')
  )
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialValues?.categoryId ?? undefined
  )
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(
    initialValues ? (initialValues.reminderMinutes ?? undefined) : (defaultReminder ?? undefined)
  )
  const [tagIds, setTagIds] = useState<number[]>(
    initialValues?.tags?.map((t) => t.id!).filter(Boolean) ?? []
  )
  const [showMore, setShowMore] = useState(!!initialValues?.description || !!initialValues?.location)
  const [errors, setErrors] = useState<{ title?: string; startTime?: string; endTime?: string }>({})

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!title.trim()) next.title = '请输入日程标题'
    if (!startTime) next.startTime = '请选择开始时间'
    if (!endTime) next.endTime = '请选择结束时间'
    if (startTime && endTime && startTime > endTime) {
      next.endTime = '结束时间不能早于开始时间'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      title: title.trim(),
      description: description || undefined,
      startTime: toSubmitTime(startTime, allDay),
      endTime: toSubmitTime(endTime, allDay),
      allDay,
      location: location || undefined,
      color,
      reminderMinutes,
      categoryId,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 标题 */}
      <div className="space-y-1.5">
        <Label htmlFor="event-title">标题 *</Label>
        <Input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: undefined })) }}
          placeholder="日程标题"
          maxLength={200}
          required
          autoFocus
          className={errors.title ? 'border-red-300 focus-visible:ring-red-500/20' : ''}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* 全天 + 时间 */}
      <div className="flex items-center gap-3">
        <Switch
          id="event-all-day"
          checked={allDay}
          onCheckedChange={(v) => {
            setAllDay(v)
            setStartTime(v ? startTime.slice(0, 10) : (startTime || defaultStart || ''))
            setEndTime(v ? endTime.slice(0, 10) : (endTime || defaultEnd || ''))
          }}
        />
        <Label htmlFor="event-all-day" className="text-foreground-secondary cursor-pointer">全天事件</Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="event-start">开始时间 *</Label>
          <Input
            id="event-start"
            type={allDay ? 'date' : 'datetime-local'}
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); if (errors.startTime) setErrors((p) => ({ ...p, startTime: undefined })) }}
            required
            className={errors.startTime ? 'border-red-300 focus-visible:ring-red-500/20' : ''}
          />
          {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-end">结束时间 *</Label>
          <Input
            id="event-end"
            type={allDay ? 'date' : 'datetime-local'}
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); if (errors.endTime) setErrors((p) => ({ ...p, endTime: undefined })) }}
            required
            className={errors.endTime ? 'border-red-300 focus-visible:ring-red-500/20' : ''}
          />
          {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
        </div>
      </div>

      {/* 分类 + 颜色（色板） */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>分类</Label>
          <Select
            value={categoryId !== undefined ? String(categoryId) : NO_CATEGORY}
            onValueChange={(v) => {
              if (v === NO_CATEGORY) {
                setCategoryId(undefined)
              } else {
                const cat = categories.find((c) => c.id === Number(v))
                if (!cat) return
                setCategoryId(cat.id!)
                if (cat.color) setColor(cat.color)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="无分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>无分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color ?? '#3b82f6' }} />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>颜色{categoryId !== undefined ? '（继承自分类）' : ''}</Label>
          <div className={cn('flex items-center gap-1.5 flex-wrap', categoryId !== undefined && 'opacity-50 pointer-events-none')}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all',
                  color === c && 'ring-2 ring-offset-1 ring-focus scale-110'
                )}
                style={{ backgroundColor: c }}
                disabled={categoryId !== undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 提醒 */}
      <div className="space-y-1.5">
        <Label>提前提醒</Label>
        <Select
          value={reminderMinutes !== undefined ? String(reminderMinutes) : NO_REMINDER}
          onValueChange={(v) => setReminderMinutes(v === NO_REMINDER ? undefined : Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="不提醒" />
          </SelectTrigger>
          <SelectContent>
            {REMINDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="space-y-1.5">
          <Label>标签</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = tagIds.includes(tag.id!)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setTagIds((prev) =>
                      prev.includes(tag.id!) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id!]
                    )
                  }
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus'
                  )}
                  style={{
                    backgroundColor: active ? (tag.color ?? '#3b82f6') + '20' : 'var(--color-hover)',
                    borderColor: tag.color ?? '#3b82f6',
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color ?? '#3b82f6' }} />
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 更多详情折叠 */}
      <div className="border-t border-border-subtle pt-1">
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground-secondary transition-colors py-1"
        >
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showMore && 'rotate-180')} />
          更多详情
        </button>
        {showMore && (
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-desc">描述</Label>
              <Textarea
                id="event-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="日程描述（可选）"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-location">地点</Label>
              <Input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="地点（可选）"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={loading} className="rounded-xl">
          {loading ? '保存中...' : initialValues ? '更新日程' : '创建日程'}
        </Button>
      </div>
    </form>
  )
}
