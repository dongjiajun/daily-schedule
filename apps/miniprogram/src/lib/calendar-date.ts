/**
 * 日历日期纯函数（字符串切片方案）。
 *
 * 后端 EventResponse.startTime 为 LocalDateTime 序列化（`YYYY-MM-DDTHH:mm:ss`，
 * 无时区偏移）。iOS JavaScriptCore 对该格式的 `new Date()` 解析不可靠（Invalid Date），
 * 因此日期键/时间展示全部基于字符串切片，不对后端日期串 `new Date()`。
 * 「今天」判定使用 `new Date()` 的 getFullYear/getMonth/getDate（数值构造器，
 * 小程序全端安全）。
 */

export interface MonthCell {
  /** 格内显示的日数字（1-31） */
  day: number
  /** 日期键 YYYY-MM-DD */
  key: string
  /** 是否属于当前月（false = 跨月补位，弱化显示） */
  inMonth: boolean
  /** 是否为今天 */
  isToday: boolean
}

/** 星期表头：周一至周日（月视图首列为周一） */
export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

/** 本地 Date → YYYY-MM-DD（数值构造器，无字符串解析） */
export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 今天（本地时区）的日期键 */
export function todayKey(): string {
  return dateKeyFromDate(new Date())
}

/** 后端日期时间串（YYYY-MM-DDTHH:mm:ss）→ 日期键（前 10 位切片，不解析） */
export function eventDateKey(startTimeIso: string): string {
  return startTimeIso.slice(0, 10)
}

/** 后端日期时间串 → HH:mm（第 11-16 位切片，不解析） */
export function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

/** 月份标题：2026年8月 */
export function formatMonthTitle(year: number, month: number): string {
  return `${year}年${month}月`
}

/** 日期键 + n 天 → 日期键 */
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d + n)
  return dateKeyFromDate(date)
}

/**
 * 生成月视图 42 格（6 行 × 7 列，周一起始）。
 * @param year 年份（如 2026）
 * @param month 月份 1-12
 * 首格为该月 1 日所在周的周一；不足 6 行以相邻月日期补齐（inMonth=false）。
 */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1)
  // Date#getDay: 0=周日…6=周六 → 周一为 0 的偏移
  const mondayFirstOffset = (first.getDay() + 6) % 7
  const today = todayKey()

  const cells: MonthCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month - 1, 1 - mondayFirstOffset + i)
    const key = dateKeyFromDate(date)
    cells.push({
      day: date.getDate(),
      key,
      inMonth: date.getMonth() === month - 1,
      isToday: key === today,
    })
  }
  return cells
}

/**
 * 月网格查询范围：首格 00:00:00 → 末格次日 00:00:00（排他上界）。
 * 后端语义为重叠查询（start_time < end AND end_time > start），
 * 上界必须覆盖末格全天，故取末格次日 00:00。
 */
export function monthRange(grid: MonthCell[]): { start: string; end: string } {
  return {
    start: `${grid[0].key}T00:00:00`,
    end: `${addDays(grid[grid.length - 1].key, 1)}T00:00:00`,
  }
}
