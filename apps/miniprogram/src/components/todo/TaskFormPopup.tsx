import { Input, Picker, Text, Textarea, View } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { dateKeyFromDate } from '../../lib/calendar-date'
import { PRIORITY_META, type TaskPriority } from '../../lib/tasks'

/**
 * 新建任务弹层（自绘底部弹层 + Taro 原生 Input/TextArea/Picker）。
 *
 * 不使用 NutUI Popup/Input/Textarea/DatePicker：其预编译 css 含 CSS 变量嵌套
 * calc（`calc(36rpx * var(--nut-scale-f, 1))` 等），微信 wxss 不支持 var()，
 * 开发者工具编译报错（miniprogram-todo 实测，postcss 仅警告不拦截）。
 * Picker mode='date' 为微信原生选择器：onChange 直接返回 'YYYY-MM-DD' 字符串
 * （与 calendar-date 字符串方案一致，iOS JSC 安全），无 Date 对象转换。
 */

export interface TaskFormInput {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
}

interface TaskFormPopupProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: TaskFormInput) => Promise<void>
}

const PRIORITY_OPTIONS: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function TaskFormPopup({ open, onClose, onSubmit }: TaskFormPopupProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setDueDate(undefined)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (title.trim() === '') {
      Taro.showToast({ title: '标题不能为空', icon: 'none' })
      return
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim() === '' ? undefined : description.trim(),
      priority,
      dueDate,
    })
  }

  if (!open) return null

  return (
    <View className='mp-todo-pop'>
      <View className='mp-todo-mask' onClick={handleClose} />
      <View className='mp-todo-form'>
        <Text className='mp-todo-form-title'>新建任务</Text>

        <View className='mp-todo-form-field'>
          <Text className='mp-todo-form-label'>标题</Text>
          <Input
            className='mp-todo-form-input'
            value={title}
            placeholder='任务标题'
            maxlength={200}
            onInput={e => setTitle(e.detail.value)}
          />
        </View>

        <View className='mp-todo-form-field'>
          <Text className='mp-todo-form-label'>描述</Text>
          <Textarea
            className='mp-todo-form-textarea'
            value={description}
            placeholder='描述（可选）'
            maxlength={500}
            onInput={e => setDescription(e.detail.value)}
          />
        </View>

        <View className='mp-todo-form-field'>
          <Text className='mp-todo-form-label'>优先级</Text>
          <View className='mp-todo-pri-chips'>
            {PRIORITY_OPTIONS.map(p => {
              const meta = PRIORITY_META[p]
              const selected = p === priority
              return (
                <View
                  key={p}
                  className={`mp-todo-pri-chip${selected ? ' mp-todo-pri-chip--active' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  <View className='mp-todo-pri-dot' style={{ backgroundColor: meta.color }} />
                  <Text>{meta.label}</Text>
                </View>
              )
            })}
          </View>
        </View>

        <View className='mp-todo-form-field'>
          <Text className='mp-todo-form-label'>截止日期</Text>
          <View className='mp-todo-due-row'>
            <Picker
              mode='date'
              value={dueDate ?? dateKeyFromDate(new Date())}
              onChange={e => setDueDate(e.detail.value)}
            >
              <View className={`mp-todo-due-value${dueDate ? '' : ' mp-todo-due-value--empty'}`}>
                {dueDate ?? '不设置截止日期（点按选择）'}
              </View>
            </Picker>
            {dueDate && <Text className='mp-todo-due-clear' onClick={() => setDueDate(undefined)}>清除</Text>}
          </View>
        </View>

        <View className='mp-todo-form-actions'>
          <View className='mp-todo-form-btn mp-todo-form-btn--ghost' onClick={handleClose}>
            <Text>取消</Text>
          </View>
          <View className='mp-todo-form-btn mp-todo-form-btn--primary' onClick={handleSubmit}>
            <Text>保存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
