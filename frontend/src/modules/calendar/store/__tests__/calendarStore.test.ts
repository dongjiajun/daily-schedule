import { describe, it, expect, beforeEach } from 'vitest'
import { useCalendarStore } from '../calendarStore'
import dayjs from 'dayjs'

describe('calendarStore', () => {
  beforeEach(() => {
    useCalendarStore.setState({
      currentDate: dayjs(),
      view: 'month',
      selectedEventId: null,
      modalOpen: false,
      editingEventId: null,
      filterCategoryId: null,
      filterTagId: null,
      searchKeyword: '',
      defaultStart: null,
      defaultEnd: null,
      showShortcuts: false,
      showManage: false,
      manageTab: 'categories',
    })
  })

  it('初始默认视图为 month', () => {
    const state = useCalendarStore.getState()
    expect(state.view).toBe('month')
  })

  it('setView 切换视图', () => {
    useCalendarStore.getState().setView('week')
    expect(useCalendarStore.getState().view).toBe('week')
    useCalendarStore.getState().setView('day')
    expect(useCalendarStore.getState().view).toBe('day')
    useCalendarStore.getState().setView('agenda')
    expect(useCalendarStore.getState().view).toBe('agenda')
  })

  it('setCurrentDate 更新当前日期', () => {
    const newDate = dayjs('2026-07-15')
    useCalendarStore.getState().setCurrentDate(newDate)
    expect(useCalendarStore.getState().currentDate.format('YYYY-MM-DD')).toBe('2026-07-15')
  })

  it('openCreateModal 设置默认开始/结束时间并打开弹窗', () => {
    useCalendarStore.getState().openCreateModal('2026-07-15T09:00', '2026-07-15T10:00')
    const state = useCalendarStore.getState()
    expect(state.defaultStart).toBe('2026-07-15T09:00')
    expect(state.defaultEnd).toBe('2026-07-15T10:00')
    expect(state.modalOpen).toBe(true)
    expect(state.editingEventId).toBeNull()
  })

  it('openEditModal 设置编辑 ID 并打开弹窗', () => {
    useCalendarStore.getState().openEditModal(42)
    const state = useCalendarStore.getState()
    expect(state.editingEventId).toBe(42)
    expect(state.modalOpen).toBe(true)
  })

  it('closeModal 关闭弹窗并清空状态', () => {
    useCalendarStore.getState().openEditModal(42)
    useCalendarStore.getState().closeModal()
    const state = useCalendarStore.getState()
    expect(state.modalOpen).toBe(false)
    expect(state.editingEventId).toBeNull()
  })

  it('setFilterCategory 设置和清除分类筛选', () => {
    useCalendarStore.getState().setFilterCategory(5)
    expect(useCalendarStore.getState().filterCategoryId).toBe(5)
    useCalendarStore.getState().setFilterCategory(null)
    expect(useCalendarStore.getState().filterCategoryId).toBeNull()
  })

  it('setFilterTag 设置和清除标签筛选', () => {
    useCalendarStore.getState().setFilterTag(3)
    expect(useCalendarStore.getState().filterTagId).toBe(3)
    useCalendarStore.getState().setFilterTag(null)
    expect(useCalendarStore.getState().filterTagId).toBeNull()
  })

  it('setSearchKeyword 更新搜索关键词', () => {
    useCalendarStore.getState().setSearchKeyword('会议')
    expect(useCalendarStore.getState().searchKeyword).toBe('会议')
  })

  it('openManage 打开管理面板', () => {
    useCalendarStore.getState().openManage('tags')
    expect(useCalendarStore.getState().showManage).toBe(true)
    expect(useCalendarStore.getState().manageTab).toBe('tags')
  })

  it('closeManage 关闭管理面板', () => {
    useCalendarStore.getState().openManage()
    useCalendarStore.getState().closeManage()
    expect(useCalendarStore.getState().showManage).toBe(false)
  })

  it('closeOnboarding 设置 localStorage', () => {
    useCalendarStore.getState().closeOnboarding()
    expect(localStorage.getItem('onboarding_done')).toBe('1')
    expect(useCalendarStore.getState().showOnboarding).toBe(false)
  })
})
