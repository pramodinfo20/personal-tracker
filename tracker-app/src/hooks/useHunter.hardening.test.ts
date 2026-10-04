// @vitest-environment jsdom
// Log Activity undo (through the same undo path as quest claims) and the
// uncapped per-stat history (dailyStatXP) that backs the Progress tab's
// stat breakdown.
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findActivity } from '../lib/activities'
import { DEFAULT_HUNTER, type Hunter, type LogEntry } from '../lib/hunterState'
import { xpForLevel } from '../lib/leveling'
import { statBreakdown, unattributedXPInRange } from '../lib/progress'
import { DAILY_LOG_CAP, DAILY_QUESTS } from '../lib/quests'
import { useHunter, type UndoResult } from './useHunter'

const KEY = 'p26_hunter'
const NOW = new Date('2026-10-03T12:00:00.000Z')
const TODAY = '2026-10-03'

const quest = (id: string) => DAILY_QUESTS.find((q) => q.id === id)!
const tier = (activityId: string, i: number) => findActivity(activityId)!.tiers[i]

const seed = (over: Partial<Hunter>) => {
  const h: Hunter = { ...DEFAULT_HUNTER, name: 'Tester', lastQuestDate: TODAY, dailyXP: {}, ...over }
  localStorage.setItem(KEY, JSON.stringify(h))
  return h
}

const setup = () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
}
const teardown = () => {
  vi.useRealTimers()
  localStorage.clear()
}

describe('useHunter — profile photo', () => {
  beforeEach(setup)
  afterEach(teardown)
  const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  const saved = () => JSON.parse(localStorage.getItem(KEY)!) as Hunter

  it('is persisted on the save, and removing it drops the field entirely', () => {
    seed({ xp: 40 })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.setPhoto(PHOTO))
    expect(result.current.hunter.photo).toBe(PHOTO)
    expect(saved().photo).toBe(PHOTO)

    act(() => result.current.setPhoto(null))
    expect('photo' in saved()).toBe(false)
    expect(saved().xp).toBe(40)
  })

  it('ignores anything that is not a resized photo', () => {
    seed({ photo: PHOTO })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.setPhoto('https://example.com/me.jpg'))
    act(() => result.current.setPhoto(`data:image/jpeg;base64,${'A'.repeat(300_000)}`))
    expect(saved().photo).toBe(PHOTO)
  })
})

describe('useHunter — Log Activity undo', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('reverses exactly what the entry recorded and gives the daily log slot back', () => {
    seed({ xp: 40, stats: { ...DEFAULT_HUNTER.stats, STR: 12 } })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.logActivity('running', tier('running', 2), 'Riverside')) // 10K, +45 STR
    let h = result.current.hunter
    expect(h).toMatchObject({ xp: 85, logCount: 1 })
    expect(h.stats.STR).toBe(13)
    expect(h.dailyXP[TODAY]).toBe(45)
    expect(h.dailyStatXP?.[TODAY]).toEqual({ STR: 45 })
    const entryId = h.log[0].id

    let r: UndoResult | undefined
    act(() => {
      r = result.current.undoLogActivity(entryId)
    })

    expect(r).toEqual({ ok: true })
    h = result.current.hunter
    expect(h).toMatchObject({ xp: 40, logCount: 0 })
    expect(h.stats.STR).toBe(12)
    expect(h.log).toHaveLength(0)
    expect(h.dailyXP[TODAY]).toBe(0)
    expect(h.dailyStatXP?.[TODAY]).toEqual({ STR: 0 })
  })

  it('frees the slot when the daily cap was reached, so another activity can be logged', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    for (let i = 0; i < DAILY_LOG_CAP; i++) {
      act(() => result.current.logActivity('water', tier('water', 0)))
    }
    expect(result.current.hunter.logCount).toBe(DAILY_LOG_CAP)
    act(() => result.current.logActivity('water', tier('water', 0)))
    expect(result.current.hunter.log).toHaveLength(DAILY_LOG_CAP) // capped

    const id = result.current.hunter.log[0].id
    act(() => {
      result.current.undoLogActivity(id)
    })
    expect(result.current.hunter.logCount).toBe(DAILY_LOG_CAP - 1)
    act(() => result.current.logActivity('reading', tier('reading', 1)))
    expect(result.current.hunter.logCount).toBe(DAILY_LOG_CAP)
    expect(result.current.hunter.log[0]).toMatchObject({ label: 'Reading', xp: 20 })
  })

  it('undo of a log that levelled up rolls the level back down (reverseXPGain)', () => {
    const need = xpForLevel(1)
    seed({ level: 1, xp: need - 10 })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.logActivity('running', tier('running', 2))) // +45 -> level 2
    expect(result.current.hunter.level).toBe(2)
    const id = result.current.hunter.log[0].id
    act(() => {
      result.current.undoLogActivity(id)
    })
    expect(result.current.hunter).toMatchObject({ level: 1, xp: need - 10, statPoints: 0 })
  })

  it('is refused by the same strand guard as quest undo', () => {
    // 5 XP shy of level 5 with the level-5 milestone already recorded: a +45 log
    // crosses into level 5, so undoing it would strand D-rank access.
    seed({ level: 4, xp: xpForLevel(4) - 5, unlockedShadows: [5] })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.logActivity('running', tier('running', 2)))
    expect(result.current.hunter.level).toBe(5)
    const before = result.current.hunter
    const id = before.log[0].id

    let r: UndoResult | undefined
    act(() => {
      r = result.current.undoLogActivity(id)
    })
    expect(r?.ok).toBe(false)
    expect(r?.reason).toMatch(/D-rank companion access/)
    expect(result.current.hunter).toEqual(before)
  })

  it("refuses an entry that wasn't logged today", () => {
    const yesterday: LogEntry = {
      id: 7,
      date: '2026-10-02T12:00:00.000Z',
      label: 'Running',
      xp: 45,
      stat: 'STR',
      tier: '10K',
      category: 'exercise',
    }
    const before = seed({ xp: 45, log: [yesterday], dailyXP: { '2026-10-02': 45 } })
    const { result } = renderHook(() => useHunter())
    let r: UndoResult | undefined
    act(() => {
      r = result.current.undoLogActivity(7)
    })
    expect(r).toEqual({ ok: false, reason: "That wasn't logged today." })
    expect(result.current.hunter.xp).toBe(before.xp)
    expect(result.current.hunter.log).toHaveLength(1)
  })

  it('refuses quest-claim and gate entries — those are not Log Activity', () => {
    const questEntry: LogEntry = { id: 1, date: NOW.toISOString(), label: 'Skill Grinding', xp: 25, stat: 'INT', questId: 'q_learn' }
    const gateEntry: LogEntry = { id: 2, date: NOW.toISOString(), label: 'Gate cleared: E-Rank Gate', xp: 120, stat: 'GATE' }
    seed({ xp: 145, completedToday: { q_learn: true }, log: [gateEntry, questEntry] })
    const { result } = renderHook(() => useHunter())
    for (const id of [1, 2, 999]) {
      let r: UndoResult | undefined
      act(() => {
        r = result.current.undoLogActivity(id)
      })
      expect(r).toEqual({ ok: false, reason: 'Nothing to undo.' })
    }
    expect(result.current.hunter.xp).toBe(145)
    expect(result.current.hunter.log).toHaveLength(2)
  })

  it('undoes an old free-text Log Activity entry (no category/tier) the same way', () => {
    const legacy: LogEntry = { id: 5, date: NOW.toISOString(), label: '5K run', xp: 20, stat: 'STR' }
    seed({ xp: 20, stats: { ...DEFAULT_HUNTER.stats, STR: 11 }, log: [legacy], dailyXP: { [TODAY]: 20 }, logCount: 1 })
    const { result } = renderHook(() => useHunter())
    let r: UndoResult | undefined
    act(() => {
      r = result.current.undoLogActivity(5)
    })
    expect(r).toEqual({ ok: true })
    expect(result.current.hunter).toMatchObject({ xp: 0, logCount: 0, log: [] })
    expect(result.current.hunter.stats.STR).toBe(10)
  })

  it('leaves a quest claim made the same day untouched', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const q = quest('q_learn')
    act(() => result.current.claimQuest(q, q.tiers[1])) // +25 INT
    act(() => result.current.logActivity('water', tier('water', 1))) // +15 VIT
    const logId = result.current.hunter.log[0].id
    act(() => {
      result.current.undoLogActivity(logId)
    })
    const h = result.current.hunter
    expect(h.xp).toBe(25)
    expect(h.completedToday.q_learn).toBe(true)
    expect(h.log).toHaveLength(1)
    expect(h.dailyStatXP?.[TODAY]).toEqual({ INT: 25, VIT: 0 })
  })

  it('quest undo still works through the shared path, and reverses the per-stat history too', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const q = quest('q_train')
    act(() => result.current.claimQuest(q, q.tiers[3])) // +50 STR
    expect(result.current.hunter.dailyStatXP?.[TODAY]).toEqual({ STR: 50 })
    let r: UndoResult | undefined
    act(() => {
      r = result.current.undoQuestClaim(q)
    })
    expect(r).toEqual({ ok: true })
    expect(result.current.hunter).toMatchObject({ xp: 0, completedToday: {} })
    expect(result.current.hunter.dailyStatXP?.[TODAY]).toEqual({ STR: 0 })
  })
})

describe('useHunter — uncapped per-stat history', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('stays complete past the 40-entry log cap: 60 claims over 60 days all count', () => {
    seed({})
    const q = quest('q_learn')
    // One claim (+25 INT) on each of 60 consecutive days. Each "day" is a
    // fresh app launch reading the previous day's save from storage, exactly
    // like the real app (the daily rollover clears completedToday on launch).
    for (let day = 59; day >= 0; day--) {
      vi.setSystemTime(new Date(NOW.getTime() - day * 86_400_000))
      const session = renderHook(() => useHunter())
      act(() => session.result.current.claimQuest(q, q.tiers[1]))
      session.unmount()
    }
    vi.setSystemTime(NOW)
    const h: Hunter = JSON.parse(localStorage.getItem(KEY)!)

    expect(h.log).toHaveLength(40) // the log really is capped...
    // ...so the old log-based breakdown would have shown only 40 of the 60:
    expect(h.log.reduce((sum, e) => sum + e.xp, 0)).toBe(40 * 25)
    // The uncapped history has all of them.
    const int = statBreakdown(h.dailyStatXP ?? {}, 365, NOW).find((b) => b.stat === 'INT')!.xp
    expect(int).toBe(60 * 25)
    expect(Object.keys(h.dailyStatXP ?? {})).toHaveLength(60)
    expect(unattributedXPInRange(h.dailyXP, h.dailyStatXP ?? {}, 365, NOW)).toBe(0)
  })

  it('gate bonuses are recorded (GATE bucket) but excluded from the per-stat breakdown', () => {
    seed({
      dailyXP: { [TODAY]: 120 },
      dailyStatXP: { [TODAY]: { GATE: 120 } },
    })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.logActivity('water', tier('water', 0))) // +8 VIT
    const h = result.current.hunter
    expect(h.dailyStatXP?.[TODAY]).toEqual({ GATE: 120, VIT: 8 })
    const byStat = Object.fromEntries(statBreakdown(h.dailyStatXP ?? {}, 7, NOW).map((b) => [b.stat, b.xp]))
    expect(byStat).toEqual({ STR: 0, VIT: 8, INT: 0, PER: 0, AGI: 0 })
    expect(unattributedXPInRange(h.dailyXP, h.dailyStatXP ?? {}, 7, NOW)).toBe(0)
  })

  it('backfills an older save from whatever is still in its log, once', () => {
    const log: LogEntry[] = [
      { id: 2, date: '2026-10-02T09:00:00.000Z', label: 'Physical Training', xp: 50, stat: 'STR', questId: 'q_train' },
      { id: 1, date: '2026-10-01T09:00:00.000Z', label: 'Gate cleared: E-Rank Gate', xp: 120, stat: 'GATE' },
    ]
    // dailyXP also has an older day whose entries already rolled off the log.
    seed({ log, dailyXP: { '2026-10-02': 50, '2026-10-01': 120, '2026-06-01': 300 } })
    const { result } = renderHook(() => useHunter())
    const h = result.current.hunter
    expect(h.dailyStatXP).toEqual({ '2026-10-02': { STR: 50 }, '2026-10-01': { GATE: 120 } })
    // The June day has a total but no per-stat record — reported, not guessed.
    expect(unattributedXPInRange(h.dailyXP, h.dailyStatXP ?? {}, 365, NOW)).toBe(300)
    expect(unattributedXPInRange(h.dailyXP, h.dailyStatXP ?? {}, 7, NOW)).toBe(0)
  })

  it('does not re-backfill (and so overwrite) a save that already has the history', () => {
    const existing = { '2026-09-01': { INT: 999 } }
    seed({ dailyStatXP: existing, log: [{ id: 1, date: '2026-10-02T09:00:00.000Z', label: 'x', xp: 5, stat: 'STR' }] })
    const { result } = renderHook(() => useHunter())
    expect(result.current.hunter.dailyStatXP).toEqual(existing)
  })
})
