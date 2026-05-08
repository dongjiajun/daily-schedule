import { useCalendarStore } from '../../store/calendarStore'
import { useEvents } from '../../hooks/useEvents'

export function CalendarView() {
  const { currentDate, view, filterCategoryId } = useCalendarStore()
  const { data: events } = useEvents(currentDate, view, filterCategoryId)

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white">月</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">周</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">日</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">议程</button>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {currentDate.format('YYYY年 MMMM')}
        </h2>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">←</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-100">今天</button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">→</button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <p className="text-gray-400 text-sm text-center mt-20">
          日历视图将在下一阶段实现（react-big-calendar）
        </p>
        <p className="text-gray-400 text-xs text-center mt-2">
          当前加载了 {events?.length ?? 0} 个日程
        </p>
      </div>
    </div>
  )
}
