import { View, Text } from '@tarojs/components'
// NutUI 组件级按需引入（barrel 入口会带全量样式，339 KiB → 组件级；style/css 用编译后 CSS 避免 scss 变量依赖）
import Button from '@nutui/nutui-react-taro/dist/es/packages/button'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
import { useEffect, useMemo, useState } from 'react'
// shared 包跨端复用验证：holiday 引擎（节日判定）+ pet 引擎（游走目标计算）
import { holidayEngine } from '@daily-schedule/shared/holiday'
import { computeNextTarget, createDefaultConfig } from '@daily-schedule/shared/pet'
// 微信登录骨架接入（wechat-auth）：wx.login → wechat-login → JWT 持久化
import { getStoredUser, wechatLogin, type MpUser } from '../../lib/auth'
import './index.scss'

export default function Index() {
  const [clickCount, setClickCount] = useState(0)

  // 登录态：本地已有会话直接恢复；无会话则自动静默登录（重试计数驱动重新触发）
  const [authUser, setAuthUser] = useState<MpUser | null>(() => getStoredUser())
  const [loginError, setLoginError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  // 派生「登录中」：无用户且尚未失败（避免 effect 内同步 setState）
  const loggingIn = authUser === null && loginError === null

  useEffect(() => {
    if (authUser) return
    let cancelled = false
    wechatLogin()
      .then(session => {
        if (!cancelled) setAuthUser(session.user)
      })
      .catch(err => {
        if (!cancelled) setLoginError(err instanceof Error ? err.message : '登录失败，请重试')
      })
    return () => {
      cancelled = true
    }
  }, [authUser, retryCount])

  // 今日节日（若有）
  const todayHoliday = useMemo(() => {
    const now = new Date()
    return holidayEngine.getHolidays(now)[0]?.name ?? null
  }, [])

  // 游走目标演示：wandering 模式下一跳位置（纯函数，与 Web 端引擎同源）
  const nextTarget = useMemo(
    () => computeNextTarget({ x: 100, y: 100 }, createDefaultConfig(375, 667), 'wandering'),
    []
  )

  return (
    <View className='page'>
      <View className='card'>
        <Text className='title'>日程小程序骨架</Text>
        <Text className='subtitle'>Phase 2 M2.1-2.2 · Taro 4 + NutUI</Text>
      </View>

      <View className='card'>
        <Text className='label'>微信登录（wechat-auth）</Text>
        {authUser ? (
          <Text>已登录：{authUser.displayName ?? authUser.username}</Text>
        ) : loggingIn ? (
          <Text>正在登录…</Text>
        ) : (
          <>
            <Text>登录失败：{loginError ?? '未知错误'}</Text>
            <Button type='primary' plain size='small' onClick={() => {
              setLoginError(null)
              setRetryCount(c => c + 1)
            }}>
              重试
            </Button>
          </>
        )}
      </View>

      <View className='card'>
        <Text className='label'>NutUI 组件验证</Text>
        <Button type='primary' onClick={() => setClickCount(c => c + 1)}>
          点击了 {clickCount} 次
        </Button>
      </View>

      <View className='card'>
        <Text className='label'>shared 复用验证 · 节日引擎</Text>
        <Text>今日{todayHoliday ? `是「${todayHoliday}」` : '无特殊节日'}</Text>
      </View>

      <View className='card'>
        <Text className='label'>shared 复用验证 · 宠物游走引擎</Text>
        <Text>
          下一目标: ({nextTarget.x.toFixed(0)}, {nextTarget.y.toFixed(0)})
        </Text>
      </View>
    </View>
  )
}
