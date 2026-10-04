// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHunter } from '../hooks/useHunter'
import { accessibleRanks } from './companions'
import { DEV_STREAK_DAY_XP, devGrantTickets, devSetLevel, devSetStreak } from './devTools'
import { DEFAULT_HUNTER, type Hunter } from './hunterState'
import { currentStreak } from './progress'
import { DAILY_QUESTS } from './quests'

const NOW = new Date('2026-10-04T12:00:00.000Z')
const TODAY = '2026-10-04'
const hunter = (over: Partial<Hunter> = {}): Hunter => ({
  ...DEFAULT_HUNTER,
  name: 'Tester',
  lastQuestDate: TODAY,
  dailyXP: {},
  ...over,
})
const ranksOf = (h: Hunter) => accessibleRanks(h.level, h.unlockedShadows)

describe('devSetLevel', () => {
  it('sets the level and marks every milestone up to it as reached', () => {
    const h = devSetLevel(hunter({ level: 1, xp: 60 }), 30)
    expect(h).toMatchObject({ level: 30, xp: 0, unlockedShadows: [5, 10, 15, 20, 25, 30] })
    expect(ranksOf(h)).toEqual(['D', 'C', 'B', 'A'])
  })

  it('jumping DOWN re-locks the ranks above the new level', () => {
    const high = devSetLevel(hunter(), 100)
    expect(ranksOf(high)).toEqual(['D', 'C', 'B', 'A', 'S', 'SS'])
    const low = devSetLevel(high, 7)
    expect(low.unlockedShadows).toEqual([5])
    expect(ranksOf(low)).toEqual(['D'])
    expect(ranksOf(devSetLevel(high, 1))).toEqual([])
  })

  it('leaves everything else alone and tolerates junk input', () => {
    const h = devSetLevel(hunter({ tickets: 2, recruitedCompanions: ['d_grey_wolf'], streak: 3 }), 12)
    expect(h).toMatchObject({ tickets: 2, recruitedCompanions: ['d_grey_wolf'], name: 'Tester' })
    expect(devSetLevel(hunter(), Number.NaN).level).toBe(1)
    expect(devSetLevel(hunter(), -5).level).toBe(1)
    expect(devSetLevel(hunter(), 12.9).level).toBe(12)
  })
})

describe('devGrantTickets', () => {
  it('adds to the tickets in hand', () => {
    expect(devGrantTickets(hunter(), 3).tickets).toBe(3)
    expect(devGrantTickets(hunter({ tickets: 2 }), 5).tickets).toBe(7)
  })
  it('never removes tickets or goes fractional', () => {
    expect(devGrantTickets(hunter({ tickets: 2 }), -4).tickets).toBe(2)
    expect(devGrantTickets(hunter(), 2.7).tickets).toBe(2)
    expect(devGrantTickets(hunter(), Number.NaN).tickets).toBe(0)
  })
})

describe('devSetStreak', () => {
  it.each([1, 6, 7, 14, 30])('makes the current streak exactly %i days', (n) => {
    expect(currentStreak(devSetStreak(hunter(), n, NOW).dailyXP, NOW)).toBe(n)
  })

  it('shortens a longer real streak to exactly N', () => {
    const dailyXP = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [new Date(Date.UTC(2026, 9, 4 - i)).toISOString().slice(0, 10), 40]),
    )
    const h = devSetStreak(hunter({ dailyXP }), 7, NOW)
    expect(currentStreak(h.dailyXP, NOW)).toBe(7)
    // Real XP on the days it keeps is untouched.
    expect(h.dailyXP[TODAY]).toBe(40)
  })

  it('fills only the days that had no XP', () => {
    const h = devSetStreak(hunter({ dailyXP: { '2026-10-03': 55 } }), 3, NOW)
    expect(h.dailyXP).toEqual({ '2026-10-04': DEV_STREAK_DAY_XP, '2026-10-03': 55, '2026-10-02': DEV_STREAK_DAY_XP })
  })

  it('0 clears the streak', () => {
    const h = devSetStreak(hunter({ dailyXP: { '2026-10-04': 20, '2026-10-03': 20, '2026-10-02': 20 } }), 0, NOW)
    expect(currentStreak(h.dailyXP, NOW)).toBe(0)
  })

  it('clears the "bonus already given today" marker so the bonus can be seen again', () => {
    const h = devSetStreak(hunter({ lastStreakTicketDate: TODAY }), 7, NOW)
    expect('lastStreakTicketDate' in h).toBe(false)
  })
})

describe('dev tools set up a full lottery run through the real hook', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    localStorage.setItem('p26_hunter', JSON.stringify(hunter({ dailyStatXP: {} })))
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })
  const saved = () => JSON.parse(localStorage.getItem('p26_hunter')!) as Hunter

  it('unlock a rank -> get tickets -> draw -> the companion is recruited', () => {
    const { result } = renderHook(() => useHunter())
    // Level 1: nothing to draw from, even with a ticket.
    act(() => result.current.dev.grantTickets(1))
    let drawn: ReturnType<typeof result.current.summon> = null
    act(() => {
      drawn = result.current.summon()
    })
    expect(drawn).toBeNull()
    expect(saved().tickets).toBe(1)

    act(() => result.current.dev.jumpToLevel(12))
    act(() => result.current.dev.grantTickets(2))
    expect(saved()).toMatchObject({ level: 12, tickets: 3, unlockedShadows: [5, 10] })

    act(() => {
      drawn = result.current.summon()
    })
    const r = drawn as unknown as NonNullable<ReturnType<typeof result.current.summon>>
    expect(['D', 'C']).toContain(r.companion.rank)
    expect(saved().tickets).toBe(2)
    expect(saved().recruitedCompanions).toEqual([r.companion.id])
  })

  it('set streak 7 -> claim any quest -> the real streak bonus ticket is awarded', () => {
    const { result } = renderHook(() => useHunter())
    act(() => result.current.dev.setStreak(7))
    expect(currentStreak(saved().dailyXP, NOW)).toBe(7)
    expect(saved().tickets ?? 0).toBe(0)

    const quest = DAILY_QUESTS[0]
    act(() => result.current.claimQuest(quest, quest.tiers[0]))
    expect(saved().tickets).toBe(1)
    expect(saved().lastStreakTicketDate).toBe(TODAY)
    expect(saved().claimCount).toBe(1) // the bonus, not a claim ticket
  })

  it('set streak 6 -> a claim earns no bonus', () => {
    const { result } = renderHook(() => useHunter())
    act(() => result.current.dev.setStreak(6))
    act(() => result.current.claimQuest(DAILY_QUESTS[0], DAILY_QUESTS[0].tiers[0]))
    expect(saved().tickets ?? 0).toBe(0)
  })
})
