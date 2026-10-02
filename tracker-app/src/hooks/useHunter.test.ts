// @vitest-environment jsdom
// Hook-level coverage for the tiered claim flow: claim -> log entry with
// tier -> undo via reverseXPGain + the strand guard, plus backward
// compatibility with hunter saves from the old single-XP-value system.
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_HUNTER, type Hunter, type LogEntry } from '../lib/hunterState'
import { xpForLevel } from '../lib/leveling'
import { DAILY_LOG_CAP, DAILY_QUESTS, LOG_CATEGORIES } from '../lib/quests'
import { useHunter } from './useHunter'

const KEY = 'p26_hunter'
const NOW = new Date('2026-10-02T12:00:00.000Z')
const TODAY = '2026-10-02'

const quest = (id: string) => DAILY_QUESTS.find((q) => q.id === id)!
const category = (id: string) => LOG_CATEGORIES.find((c) => c.id === id)!

const seed = (over: Partial<Hunter>) => {
  const h: Hunter = { ...DEFAULT_HUNTER, name: 'Tester', lastQuestDate: TODAY, dailyXP: {}, ...over }
  localStorage.setItem(KEY, JSON.stringify(h))
  return h
}

const stored = (): Hunter => JSON.parse(localStorage.getItem(KEY)!)

describe('useHunter — tiered daily quests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('claims a quest at the picked tier: XP, stat, completedToday, and a log entry with the tier', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const q = quest('q_train')

    act(() => result.current.claimQuest(q, q.tiers[2])) // 45 min / +35

    const h = result.current.hunter
    expect(h.xp).toBe(35)
    expect(h.stats.STR).toBe(11)
    expect(h.completedToday.q_train).toBe(true)
    expect(h.dailyXP[TODAY]).toBe(35)
    expect(h.log[0]).toMatchObject({
      label: 'Physical Training',
      xp: 35,
      stat: 'STR',
      questId: 'q_train',
      tier: '45 min',
    })
  })

  it.each(DAILY_QUESTS.flatMap((q) => q.tiers.map((t) => [q.id, t.label, t.xp] as const)))(
    '%s @ %s grants exactly +%i XP',
    (questId, tierLabel, xp) => {
      seed({})
      const { result } = renderHook(() => useHunter())
      const q = quest(questId)
      act(() => result.current.claimQuest(q, q.tiers.find((t) => t.label === tierLabel)!))
      expect(result.current.hunter.xp).toBe(xp)
      expect(result.current.hunter.log[0].xp).toBe(xp)
    },
  )

  it('rejects a tier that is not in the quest’s own list (no arbitrary XP)', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimQuest(quest('q_train'), { label: '30 min', xp: 9999 }))
    act(() => result.current.claimQuest(quest('q_train'), quest('q_recover').tiers[0]))
    expect(result.current.hunter.xp).toBe(0)
    expect(result.current.hunter.completedToday.q_train).toBeUndefined()
    expect(result.current.hunter.log).toHaveLength(0)
  })

  it('does not claim the same quest twice in a day', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const q = quest('q_learn')
    act(() => result.current.claimQuest(q, q.tiers[0]))
    act(() => result.current.claimQuest(q, q.tiers[2]))
    expect(result.current.hunter.xp).toBe(15)
    expect(result.current.hunter.log).toHaveLength(1)
  })

  it('undo reverses exactly the tier XP that was granted', () => {
    seed({ xp: 40, stats: { ...DEFAULT_HUNTER.stats, INT: 14 } })
    const { result } = renderHook(() => useHunter())
    const q = quest('q_learn')
    act(() => result.current.claimQuest(q, q.tiers[2])) // +40
    expect(result.current.hunter.xp).toBe(80)

    let r: ReturnType<typeof result.current.undoQuestClaim> | undefined
    act(() => {
      r = result.current.undoQuestClaim(q)
    })

    expect(r).toEqual({ ok: true })
    const h = result.current.hunter
    expect(h.xp).toBe(40)
    expect(h.stats.INT).toBe(14)
    expect(h.completedToday.q_learn).toBeUndefined()
    expect(h.log).toHaveLength(0)
    expect(h.dailyXP[TODAY]).toBe(0)
  })

  it('undo of a tier claim that levelled up rolls the level back down via reverseXPGain', () => {
    const need = xpForLevel(1)
    seed({ level: 1, xp: need - 10, statPoints: 0 })
    const { result } = renderHook(() => useHunter())
    const q = quest('q_train')
    act(() => result.current.claimQuest(q, q.tiers[3])) // +50 -> level 2
    expect(result.current.hunter.level).toBe(2)
    expect(result.current.hunter.xp).toBe(40)

    act(() => {
      result.current.undoQuestClaim(q)
    })
    expect(result.current.hunter.level).toBe(1)
    expect(result.current.hunter.xp).toBe(need - 10)
    expect(result.current.hunter.statPoints).toBe(0)
  })

  it('undo is refused by the strand guard when it would drop below an unlocked shadow', () => {
    // Level 10 with 10 XP banked and the level-10 shadow unlocked: undoing a
    // +50 claim would drop to level 9 and strand that shadow.
    const claim: LogEntry = {
      id: 1,
      date: NOW.toISOString(),
      label: 'Physical Training',
      xp: 50,
      stat: 'STR',
      questId: 'q_train',
      tier: '60+ min',
    }
    const before = seed({
      level: 10,
      xp: 10,
      unlockedShadows: [5, 10],
      completedToday: { q_train: true },
      log: [claim],
      dailyXP: { [TODAY]: 50 },
    })
    const { result } = renderHook(() => useHunter())

    let r: ReturnType<typeof result.current.undoQuestClaim> | undefined
    act(() => {
      r = result.current.undoQuestClaim(quest('q_train'))
    })

    expect(r?.ok).toBe(false)
    expect(r?.reason).toMatch(/Iron Sentinel/)
    expect(result.current.hunter.level).toBe(10)
    expect(result.current.hunter.xp).toBe(10)
    expect(result.current.hunter.log).toEqual(before.log)
    expect(result.current.hunter.completedToday.q_train).toBe(true)
  })

  it('claims a single-tier quest with its only tier', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const q = quest('q_discipline')
    act(() => result.current.claimQuest(q, q.tiers[0]))
    expect(result.current.hunter.log[0]).toMatchObject({ xp: 10, tier: 'Done', stat: 'AGI' })
  })

  it("undo refuses when the only matching entry is from a previous day", () => {
    seed({
      completedToday: { q_hunt: true },
      log: [
        {
          id: 1,
          date: '2026-10-01T12:00:00.000Z',
          label: 'Hunter Association',
          xp: 20,
          stat: 'PER',
          questId: 'q_hunt',
        },
      ],
    })
    const { result } = renderHook(() => useHunter())
    let r: ReturnType<typeof result.current.undoQuestClaim> | undefined
    act(() => {
      r = result.current.undoQuestClaim(quest('q_hunt'))
    })
    expect(r?.ok).toBe(false)
    expect(result.current.hunter.log).toHaveLength(1)
  })
})

describe('useHunter — backward compatibility with pre-tier saves', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  // Exactly what the old single-XP system wrote: a claim entry with questId
  // and the quest's old fixed xp (Physical Training was a flat 25), no tier.
  const oldClaim: LogEntry = {
    id: 1,
    date: '2026-10-02T08:00:00.000Z',
    label: 'Physical Training',
    xp: 25,
    stat: 'STR',
    questId: 'q_train',
  }
  // An old free-text Log Activity entry ("Moderate" tier, no category).
  const oldLog: LogEntry = { id: 2, date: '2026-10-02T07:00:00.000Z', label: '5K run', xp: 20, stat: 'STR' }

  it('loads an old save untouched — completedToday and log keep their shape', () => {
    seed({ xp: 45, completedToday: { q_train: true }, log: [oldClaim, oldLog], dailyXP: { [TODAY]: 45 } })
    const { result } = renderHook(() => useHunter())
    expect(result.current.hunter.completedToday).toEqual({ q_train: true })
    expect(result.current.hunter.log).toEqual([oldClaim, oldLog])
  })

  it("undoes an old same-day claim by its recorded 25 XP, not today's tier values", () => {
    seed({
      xp: 45,
      stats: { ...DEFAULT_HUNTER.stats, STR: 12 },
      completedToday: { q_train: true },
      log: [oldClaim, oldLog],
      dailyXP: { [TODAY]: 45 },
    })
    const { result } = renderHook(() => useHunter())

    let r: ReturnType<typeof result.current.undoQuestClaim> | undefined
    act(() => {
      r = result.current.undoQuestClaim(quest('q_train'))
    })

    expect(r).toEqual({ ok: true })
    const h = result.current.hunter
    expect(h.xp).toBe(20)
    expect(h.stats.STR).toBe(11)
    expect(h.log).toEqual([oldLog])
    expect(h.dailyXP[TODAY]).toBe(20)
    expect(h.completedToday.q_train).toBeUndefined()
  })

  it('lets an un-done old quest be re-claimed at a new tier', () => {
    seed({ xp: 25, completedToday: { q_train: true }, log: [oldClaim], dailyXP: { [TODAY]: 25 } })
    const { result } = renderHook(() => useHunter())
    const q = quest('q_train')
    act(() => {
      result.current.undoQuestClaim(q)
    })
    act(() => result.current.claimQuest(q, q.tiers[3]))
    expect(result.current.hunter.xp).toBe(50)
    expect(result.current.hunter.log[0]).toMatchObject({ xp: 50, tier: '60+ min' })
  })

  it('persists new tiered entries alongside old ones in the same log', () => {
    seed({ log: [oldLog] })
    const { result } = renderHook(() => useHunter())
    const q = quest('q_hunt')
    act(() => result.current.claimQuest(q, q.tiers[1]))
    const log = stored().log
    expect(log).toHaveLength(2)
    expect(log[0]).toMatchObject({ questId: 'q_hunt', tier: '3–4 actions', xp: 20 })
    expect(log[1]).toEqual(oldLog)
  })
})

describe('useHunter — tiered Log Activity', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it("logs a category + tier: the category's stat, the tier's XP, and the note in the label", () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const c = category('reading')
    act(() => result.current.logActivity(c, c.tiers[1], '  Dune ch. 3 '))
    const h = result.current.hunter
    expect(h.xp).toBe(20)
    expect(h.stats.INT).toBe(11)
    expect(h.logCount).toBe(1)
    expect(h.log[0]).toMatchObject({
      label: 'Reading: Dune ch. 3',
      xp: 20,
      stat: 'INT',
      tier: '30 min',
      category: 'reading',
    })
    expect(h.log[0].questId).toBeUndefined()
  })

  it('uses the category label alone when there is no note', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const c = category('hydration')
    act(() => result.current.logActivity(c, c.tiers[0]))
    expect(result.current.hunter.log[0]).toMatchObject({ label: 'Hydration', xp: 5, stat: 'VIT' })
  })

  it("rejects a tier that isn't in the category's list", () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    act(() => result.current.logActivity(category('hydration'), category('exercise').tiers[2]))
    expect(result.current.hunter.xp).toBe(0)
    expect(result.current.hunter.logCount).toBe(0)
  })

  it('still enforces the daily log cap', () => {
    seed({ logCount: DAILY_LOG_CAP })
    const { result } = renderHook(() => useHunter())
    const c = category('exercise')
    act(() => result.current.logActivity(c, c.tiers[0]))
    expect(result.current.hunter.xp).toBe(0)
  })
})

describe('useHunter — profile/dev helpers', () => {
  afterEach(() => localStorage.clear())

  it('records joinedAt at onboarding', () => {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_HUNTER))
    const { result } = renderHook(() => useHunter())
    act(() => result.current.completeOnboarding('Jin', []))
    expect(result.current.hunter.joinedAt).toEqual(expect.any(String))
  })

  it('dev.jumpToLevel / clearGateHistory / resetHunter write state directly', () => {
    seed({ level: 3, xp: 50, clearedGates: ['gate_e'] })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.dev.jumpToLevel(12))
    expect(result.current.hunter).toMatchObject({ level: 12, xp: 0 })
    act(() => result.current.dev.clearGateHistory())
    expect(result.current.hunter.clearedGates).toEqual([])
    act(() => result.current.dev.resetHunter())
    expect(result.current.hunter).toMatchObject({ name: '', level: 1, xp: 0, log: [] })
  })
})
