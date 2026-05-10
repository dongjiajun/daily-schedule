import { useState, type FormEvent } from 'react'
import type { EventResponse, CategoryResponse, TagResponse } from '../../api/types.gen'
import { useCalendarStore } from '../../store/calendarStore'

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

  const inputClass =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>标题 *</label>
        <input
          type="text"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="日程标题"
          maxLength={200}
          required
          autoFocus
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allDay"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <label htmlFor="allDay" className="text-sm text-gray-600">
          全天事件
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>开始时间 *</label>
          <input
            type={allDay ? 'date' : 'datetime-local'}
            className={inputClass}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>结束时间 *</label>
          <input
            type={allDay ? 'date' : 'datetime-local'}
            className={inputClass}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>描述</label>
        <textarea
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="日程描述（可选）"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>分类</label>
          <select
            className={inputClass}
            value={categoryId ?? ''}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">无分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="text"
              className={`${inputClass} flex-1`}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#1890ff"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>地点</label>
          <input
            type="text"
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="地点（可选）"
          />
        </div>
        <div>
          <label className={labelClass}>提前提醒</label>
          <select
            className={inputClass}
            value={reminderMinutes ?? ''}
            onChange={(e) =>
              setReminderMinutes(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          >
            <option value="">不提醒</option>
            <option value={0}>事件开始时</option>
            <option value={15}>15 分钟前</option>
            <option value={30}>30 分钟前</option>
            <option value={60}>1 小时前</option>
            <option value={1440}>1 天前</option>
          </select>
        </div>
      </div>

      {tags.length > 0 && (
        <div>
          <label className={labelClass}>标签</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors"
                style={{
                  backgroundColor: tagIds.includes(tag.id!) ? (tag.color ?? '#1890ff') + '20' : '#f3f4f6',
                  borderColor: tag.color ?? '#1890ff',
                  borderWidth: 1,
                }}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={tagIds.includes(tag.id!)}
                  onChange={() =>
                    setTagIds((prev) =>
                      prev.includes(tag.id!) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id!]
                    )
                  }
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color ?? '#1890ff' }}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '保存中...' : initialValues ? '更新日程' : '创建日程'}
        </button>
      </div>
    </form>
  )
}
