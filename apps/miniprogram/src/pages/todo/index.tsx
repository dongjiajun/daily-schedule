import { Text, View } from '@tarojs/components'
// NutUI 组件级按需引入（barrel 入口会带全量样式）
import Button from '@nutui/nutui-react-taro/dist/es/packages/button'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { UnauthorizedError } from '../../lib/api'
import { wechatLogin } from '../../lib/auth'
import {
  createTask, deleteTask, fetchTasks, moveTask,
  STATUS_LABEL, STATUS_ORDER, type TaskSummary,
} from '../../lib/tasks'
import TaskList from '../../components/todo/TaskList'
import TaskFormPopup, { type TaskFormInput } from '../../components/todo/TaskFormPopup'
import './index.scss'

/**
 * 任务列表页。
 *
 * 数据链路：GET /tasks（Bearer）→ 按状态三组分组渲染；
 * 变更（移动/新建/删除）成功 = 本地同步（值来自服务端确认响应）+ refetch 对账，
 * 不作乐观猜测。401：清除本地会话（lib/api.ts 已做）→ 静默重登 → 自动重拉。
 * 状态选择用 Taro.showActionSheet（原生 API——NutUI ActionSheet 的 css 含 CSS 变量
 * 嵌套 calc，微信 wxss 不支持 var()）；删除确认用 Taro.showModal（原生 API）。
 */
export default function TodoPage() {
  const [tasks, setTasks] = useState<TaskSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [showForm, setShowForm] = useState(false)

  // 派生「加载中」：无数据且无错误（避免 effect 内同步 setState）
  const loading = tasks === null && error === null

  useEffect(() => {
    let cancelled = false
    fetchTasks()
      .then(list => {
        if (!cancelled) {
          setTasks(list)
          setError(null)
        }
      })
      .catch(err => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) {
          // 401：静默重登（wx.login 无感）→ 自动重拉
          wechatLogin()
            .then(() => fetchTasks())
            .then(list => {
              if (!cancelled) {
                setTasks(list)
                setError(null)
              }
            })
            .catch(loginErr => {
              if (!cancelled) {
                setError(loginErr instanceof Error ? loginErr.message : '登录已失效，请重试')
              }
            })
        } else {
          setError(err instanceof Error ? err.message : '加载失败，请重试')
        }
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = () => {
    setError(null)
    setReloadKey(k => k + 1)
  }

  /** 对账刷新：失败仅提示，本地已是服务端确认结果，不覆盖现有数据 */
  const refetch = () => {
    fetchTasks()
      .then(list => {
        setTasks(list)
        setError(null)
      })
      .catch(() => {
        Taro.showToast({ title: '列表刷新失败', icon: 'none' })
      })
  }

  /** 点击状态圈 → 原生 ActionSheet 三选 → 移动（选择当前态或取消均无副作用） */
  const handlePickStatus = (task: TaskSummary) => {
    Taro.showActionSheet({
      itemList: STATUS_ORDER.map(s => STATUS_LABEL[s]),
    })
      .then(res => changeStatus(task, res.tapIndex))
      .catch(() => {
        // 用户取消（showActionSheet 取消为 reject），静默
      })
  }

  const changeStatus = async (task: TaskSummary, index: number) => {
    const status = STATUS_ORDER[index]
    if (!status || status === task.status) return
    try {
      const updated = await moveTask(task.id, status, task.sortOrder)
      setTasks(prev => prev?.map(t => (t.id === task.id ? updated : t)) ?? null)
      refetch()
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '移动失败，请重试', icon: 'none' })
    }
  }

  const handleSubmitForm = async (input: TaskFormInput) => {
    try {
      const created = await createTask(input)
      setTasks(prev => (prev ? [...prev, created] : prev))
      setShowForm(false)
      refetch()
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '创建失败，请重试', icon: 'none' })
    }
  }

  const handleDelete = async (task: TaskSummary) => {
    const result = await Taro.showModal({
      title: '删除任务',
      content: `将删除「${task.title}」，无法恢复`,
      confirmText: '删除',
      confirmColor: '#f5222d',
    })
    if (!result.confirm) return
    try {
      await deleteTask(task.id)
      setTasks(prev => (prev ? prev.filter(t => t.id !== task.id) : prev))
      refetch()
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '删除失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className='mp-todo-page'>
      <View className='mp-todo-header'>
        <Text className='mp-todo-page-title'>任务</Text>
        <View className='mp-todo-new-btn' onClick={() => setShowForm(true)}>
          <Text>+ 新建</Text>
        </View>
      </View>

      {loading ? (
        <Text className='mp-todo-status'>加载中…</Text>
      ) : error ? (
        <View className='mp-todo-error'>
          <Text className='mp-todo-status'>{error}</Text>
          <Button type='primary' plain size='small' onClick={retry}>重试</Button>
        </View>
      ) : (
        <TaskList
          tasks={tasks ?? []}
          onPickStatus={handlePickStatus}
          onDelete={handleDelete}
        />
      )}

      <TaskFormPopup open={showForm} onClose={() => setShowForm(false)} onSubmit={handleSubmitForm} />
    </View>
  )
}
