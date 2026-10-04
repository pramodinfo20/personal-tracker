// @vitest-environment jsdom
// Summon tickets and the draw, through the real hook: earned by claims and
// streaks, spent on draws that only ever come from unlocked ranks.
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMPANIONS, RANK_ACCESS_LEVEL } from '../lib/companions'
import { DEFAULT_HUNTER, type Hunter } from '../lib/hunterState'
import { DAILY_QUESTS } from '../lib/quests'
import { findActivity } from '../lib/activities'
import { useHunter } from './useHunter'

const KEY = 'p26_hunter'
const NOW = new Date('2026-10-04T12:00:00.000Z')
const TODAY = '2026-10-04'
const dayKey = (daysAgo: number) => new Date(Date.UTC(2026, 9, 4 - daysAgo)).toISOString().slice(0, 10)

const seed = (over: Partial<Hunter> = {}) =>
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...DEFAULT_HUNTER, name: 'Tester', lastQuestDate: TODAY, dailyXP: {}, dailyStatXP: {}, ...over }),
  )
const saved = () => JSON.parse(localStorage.getItem(KEY)!) as Hunter
const firstTier = (questId: string) => DAILY_QUESTS.find((q) => q.id === questId)!.tiers[0]
const quest = (id: string) => DAILY_QUESTS.find((q) => q.id === id)!

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('useHunter — earning tickets', () => {
  it('five claims of any kind (fixed quests + a logged activity) earn one ticket', () => {
    seed()
    const { result } = renderHook(() => useHunter())
    const fixed = ['q_train', 'q_learn', 'q_hunt', 'q_recover']
    for (const id of fixed) act(() => result.current.claimQuest(quest(id), firstTier(id)))
    expect(saved().tickets).toBe(0)
    expect(saved().claimCount).toBe(4)

    act(() => result.current.logActivity('running', findActivity('running')!.tiers[0]))
    expect(saved().tickets).toBe(1)
    expect(saved().claimCount).toBe(5)
  })

  it('undoing a claim and claiming again does not earn a second ticket', () => {
    seed({ claimCount: 4 })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimQuest(quest('q_train'), firstTier('q_train')))
    expect(saved().tickets).toBe(1)
    for (let i = 0; i < 3; i++) {
      act(() => void result.current.undoQuestClaim(quest('q_train')))
      expect(saved().claimCount).toBe(4)
      act(() => result.current.claimQuest(quest('q_train'), firstTier('q_train')))
    }
    expect(saved().tickets).toBe(1)
    expect(saved().claimCount).toBe(5)
  })

  it('a claim that brings the streak to 7 days earns a bonus ticket, once', () => {
    // Six days of XP up to yesterday; today's first claim makes it seven.
    const dailyXP = Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [dayKey(n), 20]))
    seed({ dailyXP })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimQuest(quest('q_train'), firstTier('q_train')))
    expect(saved().tickets).toBe(1)
    expect(saved().lastStreakTicketDate).toBe(TODAY)
    act(() => result.current.claimQuest(quest('q_learn'), firstTier('q_learn')))
    expect(saved().tickets).toBe(1)
  })

  it('a 6-day streak earns no bonus', () => {
    const dailyXP = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [dayKey(n), 20]))
    seed({ dailyXP })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimQuest(quest('q_train'), firstTier('q_train')))
    expect(saved().tickets).toBe(0)
  })
})

describe('useHunter — summon', () => {
  const draw = (result: { current: ReturnType<typeof useHunter> }) => {
    let r: ReturnType<ReturnType<typeof useHunter>['summon']> = null
    act(() => {
      r = result.current.summon()
    })
    return r as ReturnType<ReturnType<typeof useHunter>['summon']>
  }

  it('spends one ticket and recruits the drawn companion for good', () => {
    seed({ level: 12, unlockedShadows: [5, 10], tickets: 2 })
    const { result, unmount } = renderHook(() => useHunter())
    const r = draw(result)!
    expect(r.duplicate).toBe(false)
    expect(saved().tickets).toBe(1)
    expect(saved().recruitedCompanions).toEqual([r.companion.id])
    // Permanent: a fresh load of the app still has it.
    unmount()
    const again = renderHook(() => useHunter())
    expect(again.result.current.hunter.recruitedCompanions).toEqual([r.companion.id])
  })

  it('with no tickets nothing is drawn and nothing changes', () => {
    seed({ level: 12, unlockedShadows: [5, 10], tickets: 0 })
    const before = localStorage.getItem(KEY)
    const { result } = renderHook(() => useHunter())
    expect(draw(result)).toBeNull()
    expect(JSON.parse(localStorage.getItem(KEY)!).recruitedCompanions).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(KEY)!).tickets).toBe(JSON.parse(before!).tickets)
  })

  it('before any rank is unlocked the ticket is kept, not spent', () => {
    seed({ level: 3, tickets: 2 })
    const { result } = renderHook(() => useHunter())
    expect(draw(result)).toBeNull()
    expect(saved().tickets).toBe(2)
  })

  it('never draws above the unlocked ranks: 400 draws at Lv.12 are all D or C', () => {
    seed({ level: 12, unlockedShadows: [5, 10], tickets: 400 })
    const { result } = renderHook(() => useHunter())
    const ranks = new Set<string>()
    for (let i = 0; i < 400; i++) ranks.add(draw(result)!.companion.rank)
    expect([...ranks].sort()).toEqual(['C', 'D'])
    expect(saved().tickets).toBe(0)
    const allowed = COMPANIONS.filter((c) => RANK_ACCESS_LEVEL[c.rank] <= 12).map((c) => c.id)
    for (const id of saved().recruitedCompanions!) expect(allowed).toContain(id)
  })

  it('a companion already recruited comes back as a duplicate: ticket spent, nothing added', () => {
    const d = COMPANIONS.filter((c) => c.rank === 'D').map((c) => c.id)
    seed({ level: 6, unlockedShadows: [5], tickets: 3, recruitedCompanions: d })
    const { result } = renderHook(() => useHunter())
    const r = draw(result)!
    expect(r.duplicate).toBe(true)
    expect(saved().tickets).toBe(2)
    expect(saved().recruitedCompanions).toEqual(d)
  })

  it('recruiting leaves XP, level and the log untouched', () => {
    seed({ level: 12, xp: 40, unlockedShadows: [5, 10], tickets: 1 })
    const { result } = renderHook(() => useHunter())
    draw(result)
    expect(saved()).toMatchObject({ level: 12, xp: 40, log: [] })
  })
})
