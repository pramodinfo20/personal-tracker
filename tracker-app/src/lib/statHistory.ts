// Uncapped per-day, per-stat XP history (Hunter.dailyStatXP) — the per-stat
// counterpart of dailyXP. dailyXP only stores one total per day, and
// hunter.log is capped at 40 entries, so before this existed the Progress
// tab's stat breakdown silently dropped everything older than the last 40
// actions.
//
// Invariant: for every day recorded here, the buckets sum to that day's
// dailyXP. Gate bonuses (not attributed to any stat) go in a 'GATE' bucket
// to keep that true. So a day where the buckets sum to LESS than dailyXP is
// exactly a day whose per-stat split was never recorded — history from
// before this field existed and already off the end of the log — which is
// how unattributedXPInRange can tell the UI precisely what's missing.

import type { LogEntry } from './hunterState'
import type { StatKey } from './types'
import { dateKeyFromTimestamp } from './format'

export type StatBucket = StatKey | 'GATE'
export type DailyStatXP = Record<string, Partial<Record<StatBucket, number>>>

export const addDailyStatXP = (
  history: DailyStatXP | undefined,
  date: string,
  bucket: StatBucket,
  amount: number,
): DailyStatXP => {
  const key = dateKeyFromTimestamp(date)
  const day = history?.[key] ?? {}
  return { ...history, [key]: { ...day, [bucket]: (day[bucket] ?? 0) + amount } }
}

// Undo's counterpart — never drops below 0, and never invents a day.
export const subtractDailyStatXP = (
  history: DailyStatXP | undefined,
  date: string,
  bucket: StatBucket,
  amount: number,
): DailyStatXP => {
  const key = dateKeyFromTimestamp(date)
  const day = history?.[key]
  if (!day) return history ?? {}
  return { ...history, [key]: { ...day, [bucket]: Math.max(0, (day[bucket] ?? 0) - amount) } }
}

// One-time recovery for saves from before dailyStatXP existed: everything
// still in the (capped) log. Whatever already rolled off the log can't be
// recovered per-stat — only its daily total survives, in dailyXP.
export const backfillDailyStatXP = (log: LogEntry[]): DailyStatXP => {
  let history: DailyStatXP = {}
  for (const entry of log) history = addDailyStatXP(history, entry.date, entry.stat, entry.xp)
  return history
}

const sumDay = (day: Partial<Record<StatBucket, number>> | undefined): number =>
  Object.values(day ?? {}).reduce((a, b) => a + (b ?? 0), 0)

// XP earned on the given days that has no per-stat record (see the
// invariant above). 0 means the stat breakdown for those days is complete.
export const unattributedXP = (
  dailyXP: Record<string, number>,
  history: DailyStatXP,
  dateKeys: string[],
): number =>
  dateKeys.reduce((sum, key) => sum + Math.max(0, (dailyXP[key] ?? 0) - sumDay(history[key])), 0)
