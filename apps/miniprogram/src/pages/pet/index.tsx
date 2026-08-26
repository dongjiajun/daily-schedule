import { Text, View } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro, { useDidHide, useDidShow, useUnload } from '@tarojs/taro'
import { computeNextTarget, createDefaultConfig, randomMoveDuration, randomWanderInterval, type Position } from '@daily-schedule/shared/pet'
import { UnauthorizedError } from '../../lib/api'
import { wechatLogin } from '../../lib/auth'
import {
  createPet, fetchMyPet, interactWithPet, type InteractionResult, type InteractType, type PetProfile, type PetSpecies,
} from '../../lib/pet'
import PetAvatar from '../../components/pet/PetAvatar'
import PetStatus from '../../components/pet/PetStatus'
import PetInteractBar from '../../components/pet/PetInteractBar'
import PetCreateForm from '../../components/pet/PetCreateForm'
import './index.scss'

/**
 * 宠物互动页。
 *
 * 数据链路：GET /pets/me（Bearer）→ 三态（undefined 加载中 / null 无宠物→创建引导 /
 * PetProfile 展示态）。401：清除本地会话（lib/api.ts 已做）→ 静默重登 → 自动重拉。
 * 互动成功 = InteractionResult 本地同步（值来自服务端确认响应）+ refetch 对账，
 * 不作乐观猜测。
 *
 * 游走动画：shared/pet roam engine（wandering 模式）+ View 绝对定位 + CSS transition。
 * 循环为 setTimeout 链（移动到目标 → 随机等待 → 下一跳），页面隐藏/卸载双路清理；
 * 互动成功触发弹跳 class（0.6s 动画，复位 timer 一并清理）。
 */
export default function PetPage() {
  // 数据三态：undefined = 加载中；null = 无宠物（创建引导）；PetProfile = 展示态
  const [pet, setPet] = useState<PetProfile | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [createBusy, setCreateBusy] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [bouncing, setBouncing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // 游走容器高度：视口比例（design Decision 6），仅初次计算（须先于 position 声明）
  const [roamH] = useState(() => computeRoamHeight(getViewport().height))

  // 游走状态：position 驱动 View 位移；ref 持久当前值供循环闭包读取。
  // 初始位置惰性计算（依赖 roamH），避免 effect 内同步 setState（lint 规则）
  const [position, setPosition] = useState<Position>(() => createInitialPosition(roamH))
  const positionRef = useRef<Position>(position)
  const configRef = useRef(createDefaultConfig(375, 320))
  const activeRef = useRef(false)
  const wanderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const petRef = useRef<PetProfile | null | undefined>(undefined)

  useEffect(() => {
    petRef.current = pet
  }, [pet])

  // 派生「加载中」：无数据且无错误（避免 effect 内同步 setState）
  const loading = pet === undefined && error === null

  useEffect(() => {
    let cancelled = false
    fetchMyPet()
      .then(value => {
        if (!cancelled) {
          setPet(value)
          setError(null)
        }
      })
      .catch(err => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) {
          // 401：静默重登（wx.login 无感）→ 自动重拉
          wechatLogin()
            .then(() => fetchMyPet())
            .then(value => {
              if (!cancelled) {
                setPet(value)
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
    fetchMyPet()
      .then(value => {
        if (value !== null) {
          setPet(value)
          setError(null)
        }
      })
      .catch(() => {
        Taro.showToast({ title: '宠物刷新失败', icon: 'none' })
      })
  }

  // ---------- 游走循环（setTimeout 链） ----------

  const scheduleNext = (from: Position) => {
    if (!activeRef.current || !petRef.current) return
    const target = computeNextTarget(from, configRef.current, 'wandering')
    positionRef.current = target
    setPosition(target)
    const wait = randomMoveDuration() + randomWanderInterval()
    wanderTimerRef.current = setTimeout(() => scheduleNext(target), wait)
  }

  const cleanupWander = () => {
    activeRef.current = false
    if (wanderTimerRef.current) {
      clearTimeout(wanderTimerRef.current)
      wanderTimerRef.current = null
    }
  }

  // 游走启动/重建：随宠物登场（创建成功或加载成功）启动，卸载清理。
  // 不从 effect 重置位置（初始值已惰性计算；重建时从当前位置继续）
  useEffect(() => {
    if (!pet) return undefined
    const { width } = getViewport()
    configRef.current = createDefaultConfig(width, roamH)
    activeRef.current = true
    scheduleNext(positionRef.current)
    return cleanupWander
  }, [pet?.id, roamH]) // eslint-disable-line react-hooks/exhaustive-deps

  useDidHide(cleanupWander)
  useDidShow(() => {
    // 恢复循环：clearStoredSession 后 active 守卫已被 cleanup 置 false，此处重新激活
    if (petRef.current) {
      activeRef.current = true
      scheduleNext(positionRef.current)
    }
  })
  useUnload(cleanupWander)

  // ---------- 创建与互动 ----------

  const handleCreate = async (input: { species: PetSpecies; name: string }) => {
    setCreateBusy(true)
    try {
      const created = await createPet(input)
      setPet(created)
      setError(null)
      Taro.showToast({ title: `欢迎「${created.name}」`, icon: 'success' })
      refetch()
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '创建失败，请重试', icon: 'none' })
    } finally {
      setCreateBusy(false)
    }
  }

  const triggerBounce = () => {
    setBouncing(true)
    if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current)
    bounceTimerRef.current = setTimeout(() => setBouncing(false), 700)
  }

  const showFeedback = (result: InteractionResult) => {
    const parts: string[] = []
    if (result.moodChange) parts.push(`心情 ${result.moodChange > 0 ? '+' : ''}${result.moodChange}`)
    if (result.hungerChange) parts.push(`饱腹 ${result.hungerChange > 0 ? '+' : ''}${result.hungerChange}`)
    if (result.experienceGain) parts.push(`经验 +${result.experienceGain}`)
    if (result.coinChange) parts.push(`金币 ${result.coinChange > 0 ? '+' : ''}${result.coinChange}`)
    if (parts.length === 0) return
    setFeedback(parts.join('　'))
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1800)
  }

  const handleInteract = async (type: InteractType) => {
    if (interacting || !pet) return
    setInteracting(true)
    try {
      const result = await interactWithPet(type)
      // 本地同步：新值来自服务端确认响应（InteractionResult.newXXX）
      setPet(prev => (prev ? {
        ...prev,
        mood: result.newMood ?? prev.mood,
        hunger: result.newHunger ?? prev.hunger,
        experience: result.newExperience ?? prev.experience,
        coins: result.newCoins ?? prev.coins,
      } : prev))
      triggerBounce()
      showFeedback(result)
      refetch()
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '互动失败，请重试', icon: 'none' })
    } finally {
      setInteracting(false)
    }
  }

  return (
    <View className='mp-pet-page'>
      {loading ? (
        <Text className='mp-pet-status'>加载中…</Text>
      ) : error ? (
        <View className='mp-pet-error'>
          <Text className='mp-pet-status'>{error}</Text>
          <View className='mp-pet-retry-btn' onClick={retry}>
            <Text>重试</Text>
          </View>
        </View>
      ) : pet === null ? (
        <PetCreateForm busy={createBusy} onSubmit={handleCreate} />
      ) : pet ? (
        <>
          <View className='mp-pet-roam' style={{ height: `${roamH}px` }}>
            <PetAvatar species={pet.species} x={position.x} y={position.y} bouncing={bouncing} />
            {feedback && (
              <View className='mp-pet-feedback'>
                <Text>{feedback}</Text>
              </View>
            )}
          </View>
          <PetStatus pet={pet} />
          <PetInteractBar
            busy={interacting}
            onFeed={() => handleInteract('FEED')}
            onPlay={() => handleInteract('PLAY')}
          />
        </>
      ) : null}
    </View>
  )
}

/** 视口尺寸（px）：getWindowInfo 优先，退化 getSystemInfoSync，最终兜底 375×667 */
function getViewport(): { width: number; height: number } {
  try {
    const w = Taro.getWindowInfo ? Taro.getWindowInfo() : Taro.getSystemInfoSync()
    if (w && typeof w.windowWidth === 'number' && typeof w.windowHeight === 'number') {
      return { width: w.windowWidth, height: w.windowHeight }
    }
  } catch {
    // fallthrough
  }
  return { width: 375, height: 667 }
}

/** 游走容器高度：视口比例（design Decision 6） */
function computeRoamHeight(winH: number): number {
  return Math.round(Math.min(440, Math.max(280, winH * 0.42)))
}

/** 初始游走位置（游走区中部偏左） */
function createInitialPosition(roamH: number): Position {
  const { width } = getViewport()
  return { x: Math.round(width * 0.3), y: Math.round(roamH * 0.55) }
}
