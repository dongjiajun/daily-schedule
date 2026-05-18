import { useState, type FormEvent } from 'react'
import type { EventResponse, CategoryResponse, TagResponse } from '../../api/types.gen'
import { useCalendarStore } from '../../store/calendarStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

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

export function EventForm({ initialValues, categories, tags, onSubmit, loading }: EventFormProps) {
  const defaultStart = useCalendarStore((s) => s.defaultStart)
  const defaultEnd = useCalendarStore((s) => s.defaultEnd)

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [startTime, setStartTime] = useState(
    initialValues?.startTime?.slice(0, 16) ?? defaultStart ?? ''
  )
  const [endTime, setEndTime] = useState(
    initialValues?.endTime?.slice(0, 16) ?? defaultEnd ?? ''
  )
  const [allDay, setAllDay] = useState(initialValues?.allDay ?? false)
  const [location, setLocation] = useState(initialValues?.location ?? '')
  const [color, setColor] = useState(initialValues?.color ?? '#1890ff')
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialValues?.categoryId ?? undefined
  )
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(
    initialValues?.reminderMinutes ?? 15
  )
  const [tagIds, setTagIds] = useState<number[]>(
    initialValues?.tags?.map((t) => t.id!).filter(Boolean) ?? []
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description || undefined,
      startTime: startTime + ':00',
      endTime: endTime + ':00',
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
      <div className="space-y-1.5">
        <Label htmlFor="event-title">标题 *</Label>
        <Input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="日程标题"
          maxLength={200}
          required
          autoFocus
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="event-all-day"
          checked={allDay}
          onCheckedChange={setAllDay}
        />
        <Label htmlFor="event-all-day" className="text-gray-600 cursor-pointer">
          全天事件
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="event-start">开始时间 *</Label>
          <Input
            id="event-start"
            type={allDay ? 'date' : 'datetime-local'}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-end">结束时间 *</Label>
          <Input
            id="event-end"
            type={allDay ? 'date' : 'datetime-local'}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

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
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color ?? '#1890ff' }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-color-text">
            颜色{categoryId !== undefined ? '（继承自分类）' : ''}
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className={cn(
                'w-9 h-9 rounded-lg border border-gray-200 shrink-0 transition-opacity',
                categoryId !== undefined
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'cursor-pointer'
              )}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="选择颜色"
              disabled={categoryId !== undefined}
            />
            <Input
              id="event-color-text"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#1890ff"
              disabled={categoryId !== undefined}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-1.5">
          <Label>提前提醒</Label>
          <Select
            value={reminderMinutes !== undefined ? String(reminderMinutes) : NO_REMINDER}
            onValueChange={(v) =>
              setReminderMinutes(v === NO_REMINDER ? undefined : Number(v))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="不提醒" />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                      prev.includes(tag.id!)
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id!]
                    )
                  }
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'
                  )}
                  style={{
                    backgroundColor: active
                      ? (tag.color ?? '#1890ff') + '20'
                      : '#f3f4f6',
                    borderColor: tag.color ?? '#1890ff',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color ?? '#1890ff' }}
                  />
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="rounded-xl"
        >
          {loading ? '保存中...' : initialValues ? '更新日程' : '创建日程'}
        </Button>
      </div>
    </form>
  )
}
