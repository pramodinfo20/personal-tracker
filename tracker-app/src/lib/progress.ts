// Aggregation for the Progress screen. No new tracking — everything here is
// derived from state already written elsewhere. Day boundaries use the same
// local calendar convention as today()/nextResetAt() in format.ts, so
// "today" here always matches "today" on the Today screen.
//
// Nothing here reads hunter.log — it's capped at 40 entries (LOG_LIMIT in
// useHunter.ts) for Recent Activity display, so it isn't a reliable source
// once a range spans more than a handful of active days. Totals, the XP
// series and days-active read hunter.dailyXP (uncapped per-day totals);
// statBreakdown reads hunter.dailyStatXP (the same, split by stat — see
// lib/statHistory.ts).

import { STAT_META, type StatKey } from './hunterState'
import { unattributedXP, type DailyStatXP } from './statHistory'
import { localDateKey } from './format'

export type RangeKey = 'week' | 'month' | 'year'

export const RANGE_DAYS: Record<RangeKey, number> = { week: 7, month: 30, year: 365 }
export const RANGE_LABELS: Record<RangeKey, string> = { week: 'Week', month: 'Month', year: 'Year' }

const keyToLocalDate = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The last `days` local date keys (YYYY-MM-DD), oldest first, ending at `end`.
export const lastNDateKeys = (days: number, end: Date = new Date()): string[] => {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    keys.push(localDateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)))
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

// XP per stat in range, from the uncapped per-day history — complete for
// any range, not just the last 40 logged actions. Gate bonuses (the 'GATE'
// bucket) aren't attributed to any single stat, so they're excluded here —
// they still count toward totalXPInRange.
export const statBreakdown = (
  dailyStatXP: DailyStatXP,
  days: number,
  end: Date = new Date(),
): StatBreakdownEntry[] => {
  const totals: Record<StatKey, number> = { STR: 0, VIT: 0, INT: 0, PER: 0, AGI: 0 }
  for (const key of lastNDateKeys(days, end)) {
    const day = dailyStatXP[key]
    if (!day) continue
    for (const stat of Object.keys(totals) as StatKey[]) totals[stat] += day[stat] ?? 0
  }
  return STAT_META.map((s) => ({
    stat: s.key,
    label: s.label,
    icon: s.icon,
    color: s.color,
    xp: totals[s.key],
  }))
}

// XP in range that has no per-stat record: history from before dailyStatXP
// existed that had already rolled off the 40-entry log when it was
// backfilled. 0 means the breakdown above is complete for the range.
export const unattributedXPInRange = (
  dailyXP: Record<string, number>,
  dailyStatXP: DailyStatXP,
  days: number,
  end: Date = new Date(),
): number => unattributedXP(dailyXP, dailyStatXP, lastNDateKeys(days, end))

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

// Current streak: consecutive days with XP earned, counting back from
// today. A day counts only if it earned something (a 0-XP entry, e.g. a
// failed gate, doesn't). If today has no XP yet the count starts from
// yesterday — not having acted yet today doesn't break a streak; only a
// full missed day does. So the first day XP is ever earned the streak is 1.
//
// Derived from dailyXP every time rather than kept as a counter: it can't
// drift, it's right after an undo, and it doesn't depend on the app having
// been opened on any particular day.
export const currentStreak = (dailyXP: Record<string, number>, end: Date = new Date()): number => {
  const earned = (daysAgo: number): boolean => {
    const key = localDateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - daysAgo))
    return (dailyXP[key] ?? 0) > 0
  }
  let daysAgo = earned(0) ? 0 : 1
  let streak = 0
  while (earned(daysAgo)) {
    streak += 1
    daysAgo += 1
  }
  return streak
}

// 'weekday' -> "Sun" (chart x-axis ticks in the 7-point Week view).
// 'short' -> "Mar 15" (Month view's sparser ticks, and the tooltip in
// either view).
export const formatDayLabel = (dateKey: string, style: 'weekday' | 'short' = 'short'): string => {
  const d = keyToLocalDate(dateKey)
  return d.toLocaleDateString('en-US', {
    ...(style === 'weekday' ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
  })
}

// "2026-03" -> "Mar '26" for the Year chart's x-axis ticks and tooltip —
// carries the year since the trailing window can span the same month twice.
export const formatMonthLabel = (monthKey: string): string => {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
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
