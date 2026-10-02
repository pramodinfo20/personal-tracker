import { describe, expect, it } from 'vitest'
import type { LogEntry, StatKey } from './hunterState'
import {
  RADAR_MIN_DOMAIN_MAX,
  dailyXPSeries,
  daysActiveInRange,
  formatDayLabel,
  formatMonthLabel,
  lastNDateKeys,
  monthlyXPSeries,
  statBreakdown,
  statRadarData,
  statRadarDomainMax,
  totalXPInRange,
  yAxisWidthFor,
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
  it('0-fills days with no dailyXP entry', () => {
    const series = dailyXPSeries({}, 3, END)
    expect(series).toEqual([
      { date: '2026-03-13', xp: 0 },
      { date: '2026-03-14', xp: 0 },
      { date: '2026-03-15', xp: 0 },
    ])
  })

  it('reads each day\'s total straight from dailyXP', () => {
    const dailyXP = { '2026-03-14': 120, '2026-03-15': 40 }
    const series = dailyXPSeries(dailyXP, 3, END)
    expect(series).toEqual([
      { date: '2026-03-13', xp: 0 },
      { date: '2026-03-14', xp: 120 },
      { date: '2026-03-15', xp: 40 },
    ])
  })

  it('ignores dailyXP entries outside the range', () => {
    const series = dailyXPSeries({ '2026-03-01': 999 }, 3, END)
    expect(series.reduce((s, d) => s + d.xp, 0)).toBe(0)
  })
})

describe('monthlyXPSeries', () => {
  it('buckets the trailing window into calendar months, oldest first', () => {
    const dailyXP = {
      '2026-01-20': 50,
      '2026-02-01': 30,
      '2026-02-28': 20,
      '2026-03-15': 40,
    }
    // 60-day trailing window from END (2026-03-15) starts 2026-01-15.
    const buckets = monthlyXPSeries(dailyXP, 60, END)
    expect(buckets).toEqual([
      { month: '2026-01', xp: 50 },
      { month: '2026-02', xp: 50 },
      { month: '2026-03', xp: 40 },
    ])
  })

  it('ignores dailyXP entries outside the window', () => {
    const buckets = monthlyXPSeries({ '2025-01-01': 999 }, 30, END)
    expect(buckets.reduce((s, b) => s + b.xp, 0)).toBe(0)
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
  it('sums dailyXP entries in range', () => {
    const dailyXP = { '2026-03-15': 25, '2026-03-14': 120, '2026-01-01': 999 }
    expect(totalXPInRange(dailyXP, 3, END)).toBe(145)
  })
})

describe('daysActiveInRange', () => {
  it('counts days with a dailyXP key, including a 0-XP day', () => {
    const dailyXP = { '2026-03-15': 25, '2026-03-13': 0 }
    expect(daysActiveInRange(dailyXP, 3, END)).toBe(2)
  })

  it('is 0 for an empty dailyXP map', () => {
    expect(daysActiveInRange({}, 7, END)).toBe(0)
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

describe('formatMonthLabel', () => {
  it('formats month + 2-digit year, for the Year view', () => {
    expect(formatMonthLabel('2026-03')).toBe("Mar '26")
    expect(formatMonthLabel('2025-12')).toBe("Dec '25")
  })
})

describe('yAxisWidthFor', () => {
  it('fits the rounded-up top tick: 2-3 digit maxes get a 3-digit-wide axis', () => {
    // A 95 max gets a "100" top tick from recharts.
    expect(yAxisWidthFor(95)).toBe(yAxisWidthFor(120))
    expect(yAxisWidthFor(95)).toBeGreaterThanOrEqual(3 * 6.5 + 14)
  })

  it('grows for four-digit Year totals', () => {
    expect(yAxisWidthFor(1500)).toBeGreaterThan(yAxisWidthFor(150))
  })

  it('never goes below a usable minimum, even with no XP', () => {
    expect(yAxisWidthFor(0)).toBe(28)
  })
})

describe('statRadarData', () => {
  it('returns the 5 stats in STR/AGI/INT/PER/VIT order with labels', () => {
    const data = statRadarData({ STR: 16, VIT: 13, INT: 15, PER: 12, AGI: 11 })
    expect(data.map((d) => d.stat)).toEqual(['STR', 'AGI', 'INT', 'PER', 'VIT'])
    expect(data.map((d) => d.value)).toEqual([16, 11, 15, 12, 13])
    expect(data[0].label).toBe('Strength')
  })

  it('treats missing/negative stats as 0 (old or partial saves)', () => {
    const data = statRadarData({ STR: 12, INT: -3 } as Partial<Record<StatKey, number>>)
    expect(data.map((d) => d.value)).toEqual([12, 0, 0, 0, 0])
    expect(statRadarData(undefined).every((d) => d.value === 0)).toBe(true)
  })
})

describe('statRadarDomainMax', () => {
  it('adds ~20% headroom over the highest stat, rounded up to a multiple of 5', () => {
    expect(statRadarDomainMax(statRadarData({ STR: 50, AGI: 10, INT: 10, PER: 10, VIT: 10 }))).toBe(60)
    expect(statRadarDomainMax(statRadarData({ STR: 33, AGI: 10, INT: 10, PER: 10, VIT: 10 }))).toBe(40)
  })

  it('floors at RADAR_MIN_DOMAIN_MAX so all-zero stats still render a real chart', () => {
    expect(statRadarDomainMax(statRadarData({ STR: 0, AGI: 0, INT: 0, PER: 0, VIT: 0 }))).toBe(
      RADAR_MIN_DOMAIN_MAX,
    )
  })

  it("keeps a brand-new hunter's even 10s well inside the outer ring", () => {
    const max = statRadarDomainMax(statRadarData({ STR: 10, AGI: 10, INT: 10, PER: 10, VIT: 10 }))
    expect(max).toBe(20)
    expect(10 / max).toBeLessThan(0.8)
  })
})
