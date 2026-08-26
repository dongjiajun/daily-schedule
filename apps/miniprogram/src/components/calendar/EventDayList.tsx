import { Text, View } from '@tarojs/components'
import { formatTime } from '../../lib/calendar-date'
import { DEFAULT_EVENT_COLOR } from '../../lib/config'
import type { EventSummary } from '../../lib/events'

/**
 * 选中日事件列表（只读）。
 * startTime 升序（数据层已排序）；全天事件显示「全天」，否则 HH:mm；
 * 色点 + 标题 + 分类名；无事件显示空态。无新建/编辑/删除入口。
 */

interface EventDayListProps {
  events: EventSummary[]
}

export default function EventDayList({ events }: EventDayListProps) {
  if (events.length === 0) {
    return (
      <View className='mp-cal-empty'>
        <Text>当天暂无日程</Text>
      </View>
    )
  }
  return (
    <View className='mp-cal-event-list'>
      {events.map(event => (
        <View key={event.id} className='mp-cal-event-item'>
          <View className='mp-cal-event-dot' style={{ backgroundColor: event.color || DEFAULT_EVENT_COLOR }} />
          <View className='mp-cal-event-main'>
            <Text className='mp-cal-event-title'>{event.title}</Text>
            {event.categoryName && <Text className='mp-cal-event-category'>{event.categoryName}</Text>}
          </View>
          <Text className='mp-cal-event-time'>
            {event.allDay ? '全天' : formatTime(event.startTime)}
          </Text>
        </View>
      ))}
    </View>
  )
}
