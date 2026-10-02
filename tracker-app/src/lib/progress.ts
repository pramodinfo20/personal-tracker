// Aggregation for the Progress screen. No new tracking — everything here is
// derived from state already written elsewhere. Day boundaries use the same
// UTC convention as today()/nextResetAt() in format.ts, so "today" here
// always matches "today" on the Today screen.
//
// Week/Month/Year totals, the XP series and days-active all read from
// hunter.dailyXP (an uncapped per-day total, keyed the same way) rather than
// hunter.log — the log is capped at 40 entries (LOG_LIMIT in useHunter.ts)
// for Recent Activity display, so it isn't a reliable source once a range
// spans more than a handful of active days. statBreakdown is the one
// exception: per-stat XP isn't tracked outside the log, so it still reads
// hunter.log and inherits that same cap — see its doc comment.

import { STAT_META, type LogEntry, type StatKey } from './hunterState'

export type RangeKey = 'week' | 'month' | 'year'

export const RANGE_DAYS: Record<RangeKey, number> = { week: 7, month: 30, year: 365 }
export const RANGE_LABELS: Record<RangeKey, string> = { week: 'Week', month: 'Month', year: 'Year' }

const dateKey = (d: Date): string => d.toISOString().slice(0, 10)

// The last `days` UTC date keys (YYYY-MM-DD), oldest first, ending at `end`.
export const lastNDateKeys = (days: number, end: Date = new Date()): string[] => {
  const y = end.getUTCFullYear()
  const m = end.getUTCMonth()
  const d = end.getUTCDate()
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dateKey(new Date(Date.UTC(y, m, d - i))))
  }
  return keys
}

export interface DailyXP {
  date: string
  xp: number
}

// One point per day in range, oldest first, 0-filled for days with no
// activity — so the chart's x-axis is always the full range, not just the
// days that happened to have entries.
export const dailyXPSeries = (
  dailyXP: Record<string, number>,
  days: number,
  end: Date = new Date(),
): DailyXP[] => {
  const keys = lastNDateKeys(days, end)
  return keys.map((date) => ({ date, xp: dailyXP[date] ?? 0 }))
}

export interface MonthlyXP {
  month: string
  xp: number
}

// Year view's chart buckets the same trailing `days` window totalXPInRange/
// daysActiveInRange use into calendar months, so the chart and the summary
// strip's numbers always agree. The first and last buckets are typically
// partial months (whatever part of that month falls inside the window) —
// this reads as a rolling ~13-month view rather than 12 clean calendar
// months, which is fine since the x-axis labels carry the year too.
export const monthlyXPSeries = (
  dailyXP: Record<string, number>,
  days: number,
  end: Date = new Date(),
): MonthlyXP[] => {
  const keys = lastNDateKeys(days, end)
  const order: string[] = []
  const totals = new Map<string, number>()
  for (const key of keys) {
    const month = key.slice(0, 7)
    if (!totals.has(month)) {
      totals.set(month, 0)
      order.push(month)
    }
    totals.set(month, (totals.get(month) ?? 0) + (dailyXP[key] ?? 0))
  }
  return order.map((month) => ({ month, xp: totals.get(month) ?? 0 }))
}

export interface StatBreakdownEntry {
  stat: StatKey
  label: string
  icon: string
  color: string
  xp: number
}

// XP per stat in range. Gate-clear entries (stat: 'GATE') aren't attributed
// to any single stat, so they're excluded here — they still count toward
// totalXPInRange. Unlike the other aggregations on this page, this one has
// no uncapped source to read from — dailyXP only stores a daily total, not
// a per-stat breakdown — so it stays sourced from hunter.log and inherits
// its 40-entry cap. For Week (and usually Month) that's rarely a problem in
// practice; for Year it will typically only reflect recent activity, not
// the full range. The Progress screen surfaces that caveat in the UI for
// the Year range.
export const statBreakdown = (
  log: LogEntry[],
  days: number,
  end: Date = new Date(),
): StatBreakdownEntry[] => {
  const keys = new Set(lastNDateKeys(days, end))
  const totals: Record<StatKey, number> = { STR: 0, VIT: 0, INT: 0, PER: 0, AGI: 0 }
  for (const entry of log) {
    if (entry.stat === 'GATE') continue
    if (!keys.has(entry.date.slice(0, 10))) continue
    totals[entry.stat] += entry.xp
  }
  return STAT_META.map((s) => ({
    stat: s.key,
    label: s.label,
    icon: s.icon,
    color: s.color,
    xp: totals[s.key],
  }))
}

export const totalXPInRange = (
  dailyXP: Record<string, number>,
  days: number,
  end: Date = new Date(),
): number => {
  const keys = lastNDateKeys(days, end)
  return keys.reduce((sum, key) => sum + (dailyXP[key] ?? 0), 0)
}

// Counts days that have a dailyXP key at all (not just a positive value) —
// a 0-XP day (e.g. a failed gate) still registers as "active" the same way
// it did as a log entry before dailyXP existed. See Hunter.dailyXP's doc
// comment / addDailyXP in useHunter.ts.
export const daysActiveInRange = (
  dailyXP: Record<string, number>,
  days: number,
  end: Date = new Date(),
): number => {
  const keys = lastNDateKeys(days, end)
  return keys.reduce((count, key) => count + (key in dailyXP ? 1 : 0), 0)
}

// 'weekday' -> "Sun" (chart x-axis ticks in the 7-point Week view).
// 'short' -> "Mar 15" (Month view's sparser ticks, and the tooltip in
// either view — parsed as UTC noon so no local-timezone day can shift it).
export const formatDayLabel = (dateKey: string, style: 'weekday' | 'short' = 'short'): string => {
  const d = new Date(`${dateKey}T12:00:00.000Z`)
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    ...(style === 'weekday' ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
  })
}

// "2026-03" -> "Mar '26" for the Year chart's x-axis ticks and tooltip —
// carries the year since the trailing window can span the same month twice.
export const formatMonthLabel = (monthKey: string): string => {
  const d = new Date(`${monthKey}-01T12:00:00.000Z`)
  const label = d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', year: '2-digit' })
  return label.replace(' ', " '")
}

// Y-axis width (px) for the XP bar chart, sized to its widest tick label so
// nothing is clipped — Week/Month max out in the tens or hundreds, but Year
// buckets whole months and can reach four digits. recharts rounds the top
// tick up to a "nice" number (e.g. a 95 max gets a 100 tick), so this sizes
// for one more digit than the raw max when it's within 25% of the next
// power of ten. ~6.5px per digit at the chart's 10px tick font, plus room
// for recharts' tick padding.
export const yAxisWidthFor = (maxValue: number): number => {
  const niceMax = Math.max(1, Math.ceil(maxValue * 1.25))
  const digits = String(niceMax).length
  return Math.max(28, Math.ceil(digits * 6.5 + 14))
}

export interface StatRadarPoint {
  stat: StatKey
  label: string
  value: number
}

// Axis order for the Stat Balance radar — STR/AGI/INT/PER/VIT, so the
// physical stats (STR, AGI) sit next to each other at the top.
export const RADAR_STAT_ORDER: StatKey[] = ['STR', 'AGI', 'INT', 'PER', 'VIT']

export const statRadarData = (stats: Partial<Record<StatKey, number>> | undefined): StatRadarPoint[] =>
  RADAR_STAT_ORDER.map((stat) => ({
    stat,
    label: STAT_META.find((s) => s.key === stat)?.label ?? stat,
    value: Math.max(0, stats?.[stat] ?? 0),
  }))

// Smallest radial-axis max the radar ever uses: keeps an all-zero (or
// all-tiny) stat block from collapsing into a degenerate dot, and keeps a
// brand-new hunter's even 10s from reading as "maxed out".
export const RADAR_MIN_DOMAIN_MAX = 20

// Radial-axis max: 20% headroom over the highest stat so the polygon never
// touches the outer ring, rounded up to a multiple of 5 for tidy rings,
// floored at RADAR_MIN_DOMAIN_MAX.
export const statRadarDomainMax = (data: StatRadarPoint[]): number => {
  const highest = Math.max(0, ...data.map((d) => d.value))
  return Math.max(RADAR_MIN_DOMAIN_MAX, Math.ceil((highest * 1.2) / 5) * 5)
}
