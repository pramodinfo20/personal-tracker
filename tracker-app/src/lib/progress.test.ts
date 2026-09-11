import { describe, expect, it } from 'vitest'
import type { LogEntry } from './hunterState'
import {
  dailyXPSeries,
  daysActiveInRange,
  formatDayLabel,
  lastNDateKeys,
  statBreakdown,
  totalXPInRange,
} from './progress'

const END = new Date('2026-03-15T12:00:00.000Z') // a Sunday, mid-day UTC

const entry = (overrides: Partial<LogEntry>): LogEntry => ({
  id: Math.random(),
  date: '2026-03-15T10:00:00.000Z',
  label: 'test',
  xp: 10,
  stat: 'STR',
  ...overrides,
})

describe('lastNDateKeys', () => {
  it('returns `days` keys, oldest first, ending at `end`', () => {
    expect(lastNDateKeys(3, END)).toEqual(['2026-03-13', '2026-03-14', '2026-03-15'])
  })

  it('rolls correctly across a month boundary', () => {
    const keys = lastNDateKeys(3, new Date('2026-03-01T00:00:00.000Z'))
    expect(keys).toEqual(['2026-02-27', '2026-02-28', '2026-03-01'])
  })
})

describe('dailyXPSeries', () => {
  it('0-fills days with no log entries', () => {
    const series = dailyXPSeries([], 3, END)
    expect(series).toEqual([
      { date: '2026-03-13', xp: 0 },
      { date: '2026-03-14', xp: 0 },
      { date: '2026-03-15', xp: 0 },
    ])
  })

  it('sums multiple entries on the same day, including GATE entries', () => {
    const log: LogEntry[] = [
      entry({ date: '2026-03-15T08:00:00.000Z', xp: 25 }),
      entry({ date: '2026-03-15T20:00:00.000Z', xp: 15 }),
      entry({ date: '2026-03-14T09:00:00.000Z', xp: 120, stat: 'GATE' }),
    ]
    const series = dailyXPSeries(log, 3, END)
    expect(series).toEqual([
      { date: '2026-03-13', xp: 0 },
      { date: '2026-03-14', xp: 120 },
      { date: '2026-03-15', xp: 40 },
    ])
  })

  it('ignores entries outside the range', () => {
    const log: LogEntry[] = [entry({ date: '2026-03-01T00:00:00.000Z', xp: 999 })]
    const series = dailyXPSeries(log, 3, END)
    expect(series.reduce((s, d) => s + d.xp, 0)).toBe(0)
  })
})

describe('statBreakdown', () => {
  it('sums xp per stat and excludes GATE entries', () => {
    const log: LogEntry[] = [
      entry({ date: '2026-03-15T08:00:00.000Z', xp: 25, stat: 'STR' }),
      entry({ date: '2026-03-15T09:00:00.000Z', xp: 20, stat: 'STR' }),
      entry({ date: '2026-03-14T09:00:00.000Z', xp: 15, stat: 'VIT' }),
      entry({ date: '2026-03-14T10:00:00.000Z', xp: 300, stat: 'GATE' }),
    ]
    const breakdown = statBreakdown(log, 3, END)
    const byStat = Object.fromEntries(breakdown.map((b) => [b.stat, b.xp]))
    expect(byStat).toEqual({ STR: 45, VIT: 15, INT: 0, PER: 0, AGI: 0 })
  })

  it('always returns all 5 stats, in STAT_META order', () => {
    const breakdown = statBreakdown([], 7, END)
    expect(breakdown.map((b) => b.stat)).toEqual(['STR', 'VIT', 'INT', 'PER', 'AGI'])
  })
})

describe('totalXPInRange', () => {
  it('sums everything in range, including GATE entries', () => {
    const log: LogEntry[] = [
      entry({ date: '2026-03-15T08:00:00.000Z', xp: 25 }),
      entry({ date: '2026-03-14T08:00:00.000Z', xp: 120, stat: 'GATE' }),
      entry({ date: '2026-01-01T08:00:00.000Z', xp: 999 }), // outside range
    ]
    expect(totalXPInRange(log, 3, END)).toBe(145)
  })
})

describe('daysActiveInRange', () => {
  it('counts distinct days with at least one entry, not entry count', () => {
    const log: LogEntry[] = [
      entry({ date: '2026-03-15T08:00:00.000Z' }),
      entry({ date: '2026-03-15T20:00:00.000Z' }),
      entry({ date: '2026-03-13T08:00:00.000Z' }),
    ]
    expect(daysActiveInRange(log, 3, END)).toBe(2)
  })

  it('is 0 for an empty log', () => {
    expect(daysActiveInRange([], 7, END)).toBe(0)
  })
})

describe('formatDayLabel', () => {
  it('formats weekday style for the Week view', () => {
    expect(formatDayLabel('2026-03-15', 'weekday')).toBe('Sun')
    expect(formatDayLabel('2026-03-16', 'weekday')).toBe('Mon')
  })

  it('formats month/day style by default, for the Month view and tooltips', () => {
    expect(formatDayLabel('2026-03-15')).toBe('Mar 15')
    expect(formatDayLabel('2026-12-01', 'short')).toBe('Dec 1')
  })
})
