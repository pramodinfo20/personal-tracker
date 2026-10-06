import { describe, expect, it } from 'vitest'
import type { LogEntry } from './hunterState'
import {
  addDailyStatXP,
  backfillDailyStatXP,
  subtractDailyStatXP,
  unattributedXP,
} from './statHistory'

const localIso = (day: number, hour: number, minute = 0): string =>
  new Date(2026, 9, day, hour, minute).toISOString()

describe('addDailyStatXP', () => {
  it('accumulates per stat within a local day', () => {
    let h = addDailyStatXP(undefined, localIso(3, 8), 'STR', 25)
    h = addDailyStatXP(h, localIso(3, 21), 'STR', 20)
    h = addDailyStatXP(h, localIso(3, 21, 30), 'INT', 10)
    h = addDailyStatXP(h, localIso(4, 0, 10), 'STR', 5)
    expect(h).toEqual({ '2026-10-03': { STR: 45, INT: 10 }, '2026-10-04': { STR: 5 } })
  })

  it('does not mutate the history it was given', () => {
    const before = { '2026-10-03': { STR: 25 } }
    addDailyStatXP(before, '2026-10-03T08:00:00.000Z', 'STR', 20)
    expect(before).toEqual({ '2026-10-03': { STR: 25 } })
  })
})

describe('subtractDailyStatXP', () => {
  it('is the inverse of add', () => {
    const h = addDailyStatXP({ '2026-10-03': { STR: 25, INT: 10 } }, '2026-10-03', 'STR', 20)
    expect(subtractDailyStatXP(h, '2026-10-03T09:00:00.000Z', 'STR', 20)).toEqual({
      '2026-10-03': { STR: 25, INT: 10 },
    })
  })

  it('never goes below zero and never invents a day', () => {
    expect(subtractDailyStatXP({ '2026-10-03': { STR: 5 } }, '2026-10-03', 'STR', 50)).toEqual({
      '2026-10-03': { STR: 0 },
    })
    expect(subtractDailyStatXP({}, '2026-10-03', 'STR', 50)).toEqual({})
    expect(subtractDailyStatXP(undefined, '2026-10-03', 'STR', 50)).toEqual({})
  })
})

describe('backfillDailyStatXP', () => {
  const entry = (over: Partial<LogEntry>): LogEntry => ({
    id: Math.random(),
    date: '2026-10-03T09:00:00.000Z',
    label: 'x',
    xp: 10,
    stat: 'STR',
    ...over,
  })

  it('rebuilds the history from a log, with gate entries in the GATE bucket', () => {
    const log = [
      entry({ xp: 25, stat: 'STR' }),
      entry({ xp: 20, stat: 'STR' }),
      entry({ xp: 15, stat: 'VIT', date: '2026-10-02T09:00:00.000Z' }),
      entry({ xp: 120, stat: 'GATE', date: '2026-10-02T10:00:00.000Z' }),
      entry({ xp: 0, stat: 'GATE', date: '2026-10-01T10:00:00.000Z' }), // failed gate
    ]
    expect(backfillDailyStatXP(log)).toEqual({
      '2026-10-03': { STR: 45 },
      '2026-10-02': { VIT: 15, GATE: 120 },
      '2026-10-01': { GATE: 0 },
    })
  })

  it('is empty for an empty log', () => {
    expect(backfillDailyStatXP([])).toEqual({})
  })
})

describe('unattributedXP', () => {
  it('is the XP on the given days that has no per-stat record', () => {
    const dailyXP = { a: 100, b: 40, c: 0 }
    const history = { a: { STR: 60, GATE: 40 }, b: { INT: 10 } }
    expect(unattributedXP(dailyXP, history, ['a', 'b', 'c', 'missing'])).toBe(30)
  })

  it('never goes negative if a day somehow has more recorded than its total', () => {
    expect(unattributedXP({ a: 10 }, { a: { STR: 50 } }, ['a'])).toBe(0)
  })
})
