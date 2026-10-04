import { describe, expect, it } from 'vitest'
import {
  HEAT_LEVELS,
  WEEKS_PER_PAGE,
  formatFullDay,
  formatPageRange,
  heatLevel,
  heatmapPage,
  maxHeatmapPage,
  peakDailyXP,
} from './calendar'

// Sunday 4 Oct 2026 (UTC) — its week is Mon 28 Sep .. Sun 4 Oct.
const NOW = new Date('2026-10-04T10:00:00.000Z')
// Wednesday 7 Oct 2026 — a mid-week "today", so the page ends with future days.
const WED = new Date('2026-10-07T10:00:00.000Z')

describe('heatLevel', () => {
  it('is 0 for no XP, and 1..4 in equal steps up to the peak', () => {
    expect(heatLevel(0, 100)).toBe(0)
    expect([1, 25, 26, 50, 51, 75, 76, 100].map((xp) => heatLevel(xp, 100))).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
  })
  it('never exceeds the top level, and is 0 when there is no history', () => {
    expect(heatLevel(500, 100)).toBe(HEAT_LEVELS)
    expect(heatLevel(10, 0)).toBe(0)
  })
  it('peakDailyXP is a strong day (90th percentile), so one outlier does not flatten the rest', () => {
    expect(peakDailyXP({})).toBe(0)
    expect(peakDailyXP({ a: 0 })).toBe(0)
    // With only a few days, it is simply the best of them.
    expect(peakDailyXP({ a: 20, b: 95, c: 0 })).toBe(95)
    // Twenty ordinary days of 10..200 XP plus one 2000 XP outlier.
    const days = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`d${i}`, (i + 1) * 10]))
    const peak = peakDailyXP({ ...days, outlier: 2000 })
    expect(peak).toBe(190)
    expect(heatLevel(100, peak)).toBe(3) // an ordinary day still reads as mid-strength
    expect(heatLevel(2000, peak)).toBe(HEAT_LEVELS)
  })
})

describe('heatmapPage', () => {
  it('is 12 Monday-to-Sunday weeks ending with the current week', () => {
    const page = heatmapPage({}, 0, NOW)
    expect(page.weeks).toHaveLength(WEEKS_PER_PAGE)
    expect(page.weeks.every((w) => w.length === 7)).toBe(true)
    expect(page.weeks[0][0].date).toBe('2026-07-13') // a Monday
    expect(page.weeks[11][0].date).toBe('2026-09-28')
    expect(page.weeks[11][6].date).toBe('2026-10-04')
    expect(page.from).toBe('2026-07-13')
    expect(page.to).toBe('2026-10-04')
    for (const week of page.weeks) {
      expect(new Date(`${week[0].date}T12:00:00Z`).getUTCDay()).toBe(1)
    }
  })

  it('every day appears exactly once and in order', () => {
    const days = heatmapPage({}, 0, NOW).weeks.flat().map((c) => c.date)
    expect(new Set(days).size).toBe(84)
    expect([...days].sort()).toEqual(days)
  })

  it('marks today, and leaves the rest of the current week as future (not days)', () => {
    const page = heatmapPage({ '2026-10-08': 50 }, 0, WED)
    const lastWeek = page.weeks[11]
    expect(lastWeek.map((c) => c.today)).toEqual([false, false, true, false, false, false, false])
    expect(lastWeek.map((c) => c.future)).toEqual([false, false, false, true, true, true, true])
    expect(lastWeek[3].xp).toBe(0) // a future key is never shown
    expect(page.to).toBe('2026-10-07')
  })

  it('shades each day by its XP and totals the page', () => {
    const dailyXP = { '2026-10-04': 100, '2026-10-03': 40, '2026-09-28': 0, '2026-01-01': 999 }
    const page = heatmapPage(dailyXP, 0, NOW)
    const cell = (date: string) => page.weeks.flat().find((c) => c.date === date)!
    // Shaded against all history (the 999 day is off this page), so the same
    // cell keeps its shade on every page.
    expect(cell('2026-10-04')).toMatchObject({ xp: 100, level: 1 })
    expect(cell('2026-10-03')).toMatchObject({ xp: 40, level: 1 })
    expect(cell('2026-09-28')).toMatchObject({ xp: 0, level: 0 })
    expect(cell('2026-10-01')).toMatchObject({ xp: 0, level: 0 })
    expect(page.totalXP).toBe(140)
    // A 0-XP entry (failed gate) still counts as an active day.
    expect(page.activeDays).toBe(3)
  })

  it('page 1 is the 12 weeks before page 0, with no gap or overlap', () => {
    const p0 = heatmapPage({}, 0, NOW)
    const p1 = heatmapPage({}, 1, NOW)
    expect(p1.weeks[11][6].date).toBe('2026-07-12')
    expect(p1.weeks[0][0].date).toBe('2026-04-20')
    expect(p1.to < p0.from).toBe(true)
    expect(p1.weeks.flat().every((c) => !c.future && !c.today)).toBe(true)
  })

  it('labels the column where each month starts', () => {
    const { monthLabels, weeks } = heatmapPage({}, 0, NOW)
    expect(monthLabels[0]).toBe('Jul')
    expect(monthLabels.filter(Boolean)).toEqual(['Jul', 'Aug', 'Sep', 'Oct'])
    // "Aug" sits on the column containing Aug 1.
    const aug = monthLabels.indexOf('Aug')
    expect(weeks[aug].some((c) => c.date === '2026-08-01')).toBe(true)
  })
})

describe('maxHeatmapPage', () => {
  it('is 0 with no history, or when it all fits on the first page', () => {
    expect(maxHeatmapPage({}, NOW)).toBe(0)
    expect(maxHeatmapPage({ '2026-07-13': 10, '2026-10-04': 10 }, NOW)).toBe(0)
  })
  it('goes back exactly as far as the earliest day with history', () => {
    expect(maxHeatmapPage({ '2026-07-12': 10 }, NOW)).toBe(1) // the day before page 0 starts
    expect(maxHeatmapPage({ '2026-04-20': 10 }, NOW)).toBe(1) // first day of page 1
    expect(maxHeatmapPage({ '2026-04-19': 10 }, NOW)).toBe(2)
    const earliest = '2025-01-15'
    const max = maxHeatmapPage({ [earliest]: 10 }, NOW)
    const page = heatmapPage({ [earliest]: 10 }, max, NOW)
    expect(page.weeks.flat().some((c) => c.date === earliest)).toBe(true)
  })
})

describe('labels', () => {
  it('formatPageRange', () => {
    expect(formatPageRange(heatmapPage({}, 0, NOW))).toBe('Jul 13 – Oct 4, 2026')
    // A page spanning New Year shows both years.
    const jan = heatmapPage({}, 0, new Date('2026-01-20T10:00:00.000Z'))
    expect(formatPageRange(jan)).toBe('Nov 3, 2025 – Jan 20, 2026')
  })
  it('formatFullDay', () => {
    expect(formatFullDay('2026-10-03')).toBe('Sat, Oct 3, 2026')
  })
})
