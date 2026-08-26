import { Text, View } from '@tarojs/components'
import {
  STATUS_LABEL, STATUS_ORDER, groupTasksByStatus, type TaskSummary,
} from '../../lib/tasks'
import TaskItem from './TaskItem'

/**
 * 任务列表（恒定三组：待办/进行中/已完成）。
 * 组头为状态中文标签 + 计数；空组保留分组并显示空态文案；
 * 组内顺序由 groupTasksByStatus 保证（sortOrder 升序）。
 * 纯展示：交互经 onPickStatus / onDelete 上抛。
 */

interface TaskListProps {
  tasks: TaskSummary[]
  onPickStatus: (task: TaskSummary) => void
  onDelete: (task: TaskSummary) => void
}

export default function TaskList({ tasks, onPickStatus, onDelete }: TaskListProps) {
  const grouped = groupTasksByStatus(tasks)

  return (
    <View className='mp-todo-list'>
      {STATUS_ORDER.map(status => {
        const group = grouped.get(status) ?? []
        return (
          <View key={status} className='mp-todo-group'>
            <View className='mp-todo-group-head'>
              <Text className='mp-todo-group-title'>{STATUS_LABEL[status]}</Text>
              <Text className='mp-todo-group-count'>{group.length}</Text>
            </View>
            {group.length === 0 ? (
              <View className='mp-todo-group-empty'>
                <Text>暂无{STATUS_LABEL[status]}</Text>
              </View>
            ) : (
              group.map(task => (
                <TaskItem key={task.id} task={task} onPickStatus={onPickStatus} onDelete={onDelete} />
              ))
            )}
          </View>
        )
      })}
    </View>
  )
}
