import { Text, View } from '@tarojs/components'
import { todayKey } from '../../lib/calendar-date'
import { PRIORITY_META, type TaskSummary } from '../../lib/tasks'

/**
 * 任务行（列表项）。
 * 左侧状态标识（点击 → 状态选择面板）、标题、优先级标签色点、
 * 截止日期（过期红/今天高亮，字符串比较）、标签、描述截断；
 * 尾部删除按钮；DONE 项弱化（--done：灰显 + 标题划线）。
 * 纯展示：交互经 onPickStatus / onDelete 上抛（决策在页面层）。
 */

interface TaskItemProps {
  task: TaskSummary
  onPickStatus: (task: TaskSummary) => void
  onDelete: (task: TaskSummary) => void
}

export default function TaskItem({ task, onPickStatus, onDelete }: TaskItemProps) {
  const priority = task.priority ? PRIORITY_META[task.priority] : null
  const today = todayKey()
  const dueClass = task.dueDate
    ? task.dueDate === today
      ? 'mp-todo-due--today'
      : task.dueDate < today ? 'mp-todo-due--overdue' : ''
    : ''

  return (
    <View className={`mp-todo-item${task.status === 'DONE' ? ' mp-todo-item--done' : ''}`}>
      <View
        className={`mp-todo-status mp-todo-status--${task.status.toLowerCase()}`}
        onClick={() => onPickStatus(task)}
      >
        <Text className='mp-todo-status-check'>{task.status === 'DONE' ? '✓' : ''}</Text>
      </View>

      <View className='mp-todo-main'>
        <View className='mp-todo-title-row'>
          <Text className='mp-todo-title'>{task.title}</Text>
          {priority && (
            <View className='mp-todo-priority'>
              <View className='mp-todo-pri-dot' style={{ backgroundColor: priority.color }} />
              <Text className='mp-todo-pri-label'>{priority.label}</Text>
            </View>
          )}
          {task.dueDate && <Text className={`mp-todo-due ${dueClass}`}>{task.dueDate}</Text>}
        </View>
        {task.description && (
          <Text className='mp-todo-desc' numberOfLines={2}>{task.description}</Text>
        )}
        {task.tags.length > 0 && (
          <View className='mp-todo-tags'>
            {task.tags.map(tag => (
              <View key={tag.id} className='mp-todo-tag'>
                {tag.color && <View className='mp-todo-tag-dot' style={{ backgroundColor: tag.color }} />}
                <Text className='mp-todo-tag-name'>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text className='mp-todo-del' onClick={() => onDelete(task)}>删除</Text>
    </View>
  )
}
