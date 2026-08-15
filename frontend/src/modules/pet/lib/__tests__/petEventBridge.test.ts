import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { eventBus } from '@/core/lib/eventBus'
import { grantPetReward } from '@/api/sdk.gen'
import { usePetStore } from '../../store/petStore'
import { registerPetEventListeners, unregisterPetEventListeners } from '../petEventBridge'

vi.mock('@/api/sdk.gen', () => ({
  grantPetReward: vi.fn(),
}))

const mockGrantPetReward = vi.mocked(grantPetReward)

/** 构造 unwrap 可接受的 SDK 成功/失败结果 */
function sdkResult(data?: unknown) {
  return {
    data,
    error: data === undefined ? { message: '请先创建宠物' } : undefined,
    response: new Response(null, { status: data === undefined ? 404 : 200 }),
  }
}

function grantedResult(coins = 5) {
  return {
    granted: true,
    coinChange: coins,
    experienceGain: 10,
    moodChange: 0,
    newCoins: 105,
    newExperience: 10,
    newMood: 80,
  }
}

describe('petEventBridge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    eventBus.removeAll()
    mockGrantPetReward.mockReset()
    mockGrantPetReward.mockResolvedValue(sdkResult({ granted: false, coinChange: 0, experienceGain: 0, moodChange: 0, newCoins: 0, newExperience: 0, newMood: 0 }))
    usePetStore.setState({
      animationState: 'idle',
      emotionState: 'idle',
      bubbleMessage: null,
      comboCount: 0,
      particleTrigger: null,
      position: { x: 500, y: 300 },
    })
    registerPetEventListeners()
  })

  afterEach(() => {
    unregisterPetEventListeners()
    vi.useRealTimers()
  })

  it('event:completed 触发 happy + 连击 + 粒子', () => {
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: '测试日程' } })

    const state = usePetStore.getState()
    expect(state.emotionState).toBe('happy')
    expect(state.comboCount).toBe(1)
    // 粒子触发器已设置
    expect(state.particleTrigger).not.toBeNull()
    expect(state.particleTrigger!.type).toBe('stars')

    // bubble 延迟 300ms
    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toBe('太棒了！「测试日程」已完成！🎉')
  })

  it('task:completed 触发 happy + 连击 + 粒子', () => {
    eventBus.emit({ type: 'task:completed', payload: { taskId: '1', title: '写报告' } })

    const state = usePetStore.getState()
    expect(state.emotionState).toBe('happy')
    expect(state.comboCount).toBe(1)
    expect(state.particleTrigger).not.toBeNull()
    expect(state.particleTrigger!.type).toBe('stars')

    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toBe('任务「写报告」完成！你真棒！✅')
  })

  it('event:cancelled 触发 sad + 重置连击', () => {
    usePetStore.getState().incrementCombo()
    eventBus.emit({ type: 'event:cancelled', payload: { eventId: '2', title: '项目评审' } })

    expect(usePetStore.getState().emotionState).toBe('sad')
    expect(usePetStore.getState().comboCount).toBe(0)

    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toBe('「项目评审」取消了…')
  })

  it('event:created 触发 happy', () => {
    eventBus.emit({ type: 'event:created', payload: { eventId: '3', title: '新任务' } })

    expect(usePetStore.getState().emotionState).toBe('happy')

    vi.advanceTimersByTime(300)
    expect(usePetStore.getState().bubbleMessage).toContain('新任务')
  })

  it('3 连击触发 excited', () => {
    eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: 'A' } })
    eventBus.emit({ type: 'event:completed', payload: { eventId: '2', title: 'B' } })
    eventBus.emit({ type: 'event:completed', payload: { eventId: '3', title: 'C' } })

    expect(usePetStore.getState().comboCount).toBe(3)
    expect(usePetStore.getState().emotionState).toBe('excited')
    // 3 次都有粒子
    expect(usePetStore.getState().particleTrigger).not.toBeNull()
  })

  it('unregister 后不再响应事件', () => {
    unregisterPetEventListeners()

    eventBus.emit({ type: 'event:completed', payload: { eventId: '4', title: '不应触发' } })
    expect(usePetStore.getState().emotionState).toBe('idle')
    expect(usePetStore.getState().bubbleMessage).toBeNull()
    expect(usePetStore.getState().particleTrigger).toBeNull()
  })

  // ─── 经济奖励桥接（habit/focus/checkin） ───

  it('habit:checked → 调用奖励 API（HABIT_CHECKED, habitId）', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult(grantedResult()))

    eventBus.emit({ type: 'habit:checked', payload: { habitId: 'h1' } })
    await vi.runAllTimersAsync()

    expect(mockGrantPetReward).toHaveBeenCalledWith({
      body: { source: 'HABIT_CHECKED', refId: 'h1' },
    })
  })

  it('focus:completed → 以 sessionId 为幂等键调用奖励 API', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult(grantedResult()))

    eventBus.emit({ type: 'focus:completed', payload: { duration: 1500, sessionId: 'f-9' } })
    await vi.runAllTimersAsync()

    expect(mockGrantPetReward).toHaveBeenCalledWith({
      body: { source: 'FOCUS_COMPLETED', refId: 'f-9' },
    })
  })

  it('focus:completed 无 sessionId（旧 payload）→ 以时间戳为幂等键', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult(grantedResult()))

    eventBus.emit({ type: 'focus:completed', payload: { duration: 1500 } })
    await vi.runAllTimersAsync()

    expect(mockGrantPetReward).toHaveBeenCalledTimes(1)
    const call = mockGrantPetReward.mock.calls[0][0] as { body: { source: string; refId: string } }
    expect(call.body.source).toBe('FOCUS_COMPLETED')
    expect(call.body.refId).toBeTruthy() // 时间戳回退，非空
  })

  it('user:dailyCheckin → 以本地日期为幂等键调用奖励 API', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult(grantedResult(15)))
    const timestamp = new Date(2026, 7, 14, 10, 0, 0).getTime()

    eventBus.emit({ type: 'user:dailyCheckin', payload: { timestamp } })
    await vi.runAllTimersAsync()

    expect(mockGrantPetReward).toHaveBeenCalledWith({
      body: { source: 'DAILY_CHECKIN', refId: '2026-08-14' },
    })
  })

  it('奖励发放成功 → 金币粒子 + 气泡', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult(grantedResult(15)))

    eventBus.emit({ type: 'user:dailyCheckin', payload: { timestamp: Date.now() } })
    // 仅推进微任务（claimReward 的 await），不触发 showBubble 的 4s 自动清除定时器
    await vi.advanceTimersByTimeAsync(0)

    const state = usePetStore.getState()
    expect(state.particleTrigger).not.toBeNull()
    expect(state.particleTrigger!.type).toBe('coins')
    expect(state.bubbleMessage).toBe('+15 专注币')
  })

  it('granted=false（重复/无宠物）→ 无粒子无气泡', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult({ granted: false, coinChange: 0, experienceGain: 0, moodChange: 0, newCoins: 0, newExperience: 0, newMood: 0 }))

    eventBus.emit({ type: 'habit:checked', payload: { habitId: 'h2' } })
    await vi.runAllTimersAsync()

    expect(usePetStore.getState().particleTrigger).toBeNull()
    expect(usePetStore.getState().bubbleMessage).toBeNull()
  })

  it('奖励 API 失败 → 静默不抛异常', async () => {
    mockGrantPetReward.mockResolvedValue(sdkResult(undefined))

    expect(() => {
      eventBus.emit({ type: 'habit:checked', payload: { habitId: 'h3' } })
    }).not.toThrow()
    await vi.runAllTimersAsync()

    expect(usePetStore.getState().particleTrigger).toBeNull()
  })
})
