import { Text, View } from '@tarojs/components'
import { WEEKDAY_LABELS, type MonthCell } from '../../lib/calendar-date'
import { DEFAULT_EVENT_COLOR } from '../../lib/config'
import type { EventSummary } from '../../lib/events'

/**
 * 月视图网格（42 格，周一起始）。
 * 补位日期弱化、今天高亮（环形标记）、选中态填充、事件色点（每格 ≤3 + 「+n」）。
 * 纯展示组件：数据与选中状态由父级（pages/calendar）传入。
 */

/** 每格最多显示的色点数，超出折叠为「+n」 */
const MAX_DOTS = 3

interface MonthGridProps {
  grid: MonthCell[]
  eventsByDate: Map<string, EventSummary[]>
  selectedKey: string
  onSelect: (key: string) => void
}

export default function MonthGrid({ grid, eventsByDate, selectedKey, onSelect }: MonthGridProps) {
  return (
    <View className='mp-cal-grid'>
      <View className='mp-cal-weekday-row'>
        {WEEKDAY_LABELS.map(label => (
          <View key={label} className='mp-cal-weekday-cell'>
            <Text>{label}</Text>
          </View>
        ))}
      </View>
      <View className='mp-cal-grid-body'>
        {grid.map(cell => {
          const events = eventsByDate.get(cell.key) ?? []
          const classes = ['mp-cal-cell']
          if (!cell.inMonth) classes.push('mp-cal-cell--dim')
          if (cell.isToday) classes.push('mp-cal-cell--today')
          if (cell.key === selectedKey) classes.push('mp-cal-cell--selected')
          return (
            <View key={cell.key} className={classes.join(' ')} onClick={() => onSelect(cell.key)}>
              <Text className='mp-cal-cell-day'>{cell.day}</Text>
              {events.length > 0 && (
                <View className='mp-cal-cell-dots'>
                  {events.slice(0, MAX_DOTS).map(event => (
                    <View
                      key={event.id}
                      className='mp-cal-cell-dot'
                      style={{ backgroundColor: event.color || DEFAULT_EVENT_COLOR }}
                    />
                  ))}
                  {events.length > MAX_DOTS && (
                    <Text className='mp-cal-cell-more'>+{events.length - MAX_DOTS}</Text>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}
