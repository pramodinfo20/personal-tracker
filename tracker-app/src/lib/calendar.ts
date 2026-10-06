// The Calendar view: an activity heatmap over hunter.dailyXP — one cell per
// day, shaded by that day's XP. No data of its own. Days are the same local
// date keys dailyXP and the Progress screen use, so a cell always matches
// the day the XP was recorded under.

import { localDateKey } from './format'
import { formatDayLabel } from './progress'

/** Weeks shown at once (~12 weeks = one page). */
export const WEEKS_PER_PAGE = 12
/** Shading steps: 0 = nothing, 1..4 = increasingly intense. */
export const HEAT_LEVELS = 4

export interface HeatCell {
  /** Local "YYYY-MM-DD". */
  date: string
  xp: number
  /** 0..HEAT_LEVELS. */
  level: number
  /** After "today" — rendered as an empty slot, not a day. */
  future: boolean
  today: boolean
}

export interface HeatPage {
  /** WEEKS_PER_PAGE columns, oldest first; each is Monday..Sunday. */
  weeks: HeatCell[][]
  /** One entry per column: the month name where a new month starts, else ''. */
  monthLabels: string[]
  /** First and last (non-future) day on the page. */
  from: string
  to: string
  totalXP: number
  activeDays: number
}

const localDate = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (key: string, n: number): string => {
  const d = localDate(key)
  d.setDate(d.getDate() + n)
  return localDateKey(d)
}
/** Monday of the week containing this day. */
const mondayOf = (key: string): string => addDays(key, -((localDate(key).getDay() + 6) % 7))

// The XP that counts as "full intensity": a strong day, not the single
// best one — the 90th percentile of days that earned anything. One huge day
// (a gate bonus) would otherwise push every ordinary day into the palest
// shade. Taken over ALL history rather than the visible page, so a cell
// keeps its shade when paging back and forth.
export const peakDailyXP = (dailyXP: Record<string, number>): number => {
  const earned = Object.values(dailyXP)
    .filter((xp) => xp > 0)
    .sort((a, b) => a - b)
  if (earned.length === 0) return 0
  return earned[Math.ceil(earned.length * 0.9) - 1]
}

// 0 XP -> 0; otherwise 1..HEAT_LEVELS in equal steps up to the peak.
export const heatLevel = (xp: number, peak: number): number => {
  if (xp <= 0 || peak <= 0) return 0
  return Math.min(HEAT_LEVELS, Math.max(1, Math.ceil((xp / peak) * HEAT_LEVELS)))
}

// Page 0 ends with the current week; each higher page is WEEKS_PER_PAGE
// weeks earlier.
export const heatmapPage = (
  dailyXP: Record<string, number>,
  page: number,
  now: Date = new Date(),
): HeatPage => {
  const todayKey = localDateKey(now)
  const peak = peakDailyXP(dailyXP)
  const lastMonday = addDays(mondayOf(todayKey), -7 * WEEKS_PER_PAGE * page)
  const firstMonday = addDays(lastMonday, -7 * (WEEKS_PER_PAGE - 1))

  const weeks: HeatCell[][] = []
  const monthLabels: string[] = []
  let totalXP = 0
  let activeDays = 0
  let to = firstMonday
  for (let w = 0; w < WEEKS_PER_PAGE; w++) {
    const monday = addDays(firstMonday, 7 * w)
    const week: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(monday, d)
      const future = date > todayKey
      const xp = future ? 0 : (dailyXP[date] ?? 0)
      if (!future) {
        totalXP += xp
        // A day with an entry counts as active even at 0 XP (a failed gate)
        // — same rule as daysActiveInRange on the Progress screen.
        if (date in dailyXP) activeDays += 1
        to = date
      }
      week.push({ date, xp, level: heatLevel(xp, peak), future, today: date === todayKey })
    }
    weeks.push(week)
    // Label a column when a month starts in it (and always the first one).
    const month = monday.slice(0, 7)
    const sunday = addDays(monday, 6)
    const startsMonth = w === 0 || sunday.slice(0, 7) !== addDays(monday, -1).slice(0, 7)
    const labelKey = w === 0 || month === sunday.slice(0, 7) ? monday : sunday
    monthLabels.push(
      startsMonth
        ? localDate(labelKey).toLocaleDateString('en-US', { month: 'short' })
        : '',
    )
  }
  // Two labels in adjacent columns would collide — keep the later (real month start).
  for (let i = 0; i < monthLabels.length - 1; i++) {
    if (monthLabels[i] && monthLabels[i + 1]) monthLabels[i] = ''
  }
  return { weeks, monthLabels, from: firstMonday, to, totalXP, activeDays }
}

// The furthest page back that still has history on it (0 when there is no
// history, or it all fits on the first page).
export const maxHeatmapPage = (dailyXP: Record<string, number>, now: Date = new Date()): number => {
  const keys = Object.keys(dailyXP).sort()
  if (keys.length === 0) return 0
  const firstMondayOfPage0 = addDays(mondayOf(localDateKey(now)), -7 * (WEEKS_PER_PAGE - 1))
  const earliest = keys[0]
  if (earliest >= firstMondayOfPage0) return 0
  const daysBefore = Math.round(
    (localDate(firstMondayOfPage0).getTime() - localDate(earliest).getTime()) / 86_400_000,
  )
  return Math.ceil(daysBefore / (7 * WEEKS_PER_PAGE))
}

const withYear = (key: string): string =>
  localDate(key).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

/** "Jul 13 – Oct 4, 2026" */
export const formatPageRange = (page: HeatPage): string =>
  `${page.from.slice(0, 4) === page.to.slice(0, 4) ? formatDayLabel(page.from) : withYear(page.from)} – ${withYear(page.to)}`

/** "Sat, Oct 3, 2026" */
export const formatFullDay = (key: string): string =>
  localDate(key).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
