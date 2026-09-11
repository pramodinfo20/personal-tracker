// Pure aggregation over hunter.log for the Progress screen. No new tracking
// — every number here is derived from log entries already written by
// grantXP elsewhere (claimQuest, logActivity, completeGateTask). Day
// boundaries use the same UTC convention as today()/nextResetAt() in
// format.ts, so "today" here always matches "today" on the Today screen.

import { STAT_META, type LogEntry, type StatKey } from './hunterState'

export type RangeKey = 'week' | 'month'

export const RANGE_DAYS: Record<RangeKey, number> = { week: 7, month: 30 }
export const RANGE_LABELS: Record<RangeKey, string> = { week: 'Week', month: 'Month' }

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
  log: LogEntry[],
  days: number,
  end: Date = new Date(),
): DailyXP[] => {
  const keys = lastNDateKeys(days, end)
  const totals = new Map<string, number>(keys.map((k) => [k, 0]))
  for (const entry of log) {
    const key = entry.date.slice(0, 10)
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + entry.xp)
  }
  return keys.map((date) => ({ date, xp: totals.get(date) ?? 0 }))
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
// totalXPInRange.
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

export const totalXPInRange = (log: LogEntry[], days: number, end: Date = new Date()): number => {
  const keys = new Set(lastNDateKeys(days, end))
  let total = 0
  for (const entry of log) {
    if (keys.has(entry.date.slice(0, 10))) total += entry.xp
  }
  return total
}

export const daysActiveInRange = (
  log: LogEntry[],
  days: number,
  end: Date = new Date(),
): number => {
  const keys = new Set(lastNDateKeys(days, end))
  const active = new Set<string>()
  for (const entry of log) {
    const key = entry.date.slice(0, 10)
    if (keys.has(key)) active.add(key)
  }
  return active.size
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
