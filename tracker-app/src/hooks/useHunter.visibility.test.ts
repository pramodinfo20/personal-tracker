// @vitest-environment jsdom
// Hiding fixed quests is a display preference only: it must never change
// XP, claims or the log, and claim/undo must behave identically for
// whatever stays visible.
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from '../lib/hunterState'
import { DAILY_QUESTS } from '../lib/quests'
import { useHunter } from './useHunter'

const KEY = 'p26_hunter'
const NOW = new Date('2026-10-02T12:00:00.000Z')
const TODAY = '2026-10-02'

const quest = (id: string) => DAILY_QUESTS.find((q) => q.id === id)!

const seed = (over: Partial<Hunter>) => {
  const h: Hunter = { ...DEFAULT_HUNTER, name: 'Tester', lastQuestDate: TODAY, dailyXP: {}, ...over }
  localStorage.setItem(KEY, JSON.stringify(h))
  return h
}

const stored = (): Hunter => JSON.parse(localStorage.getItem(KEY)!)

describe('useHunter — hiding fixed quests is display-only', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('setFixedQuestEnabled only changes hiddenQuestIds, and persists it', () => {
    const before = seed({ xp: 40, completedToday: { q_learn: true } })
    const { result } = renderHook(() => useHunter())
    act(() => result.current.setFixedQuestEnabled('q_train', false))
    act(() => result.current.setFixedQuestEnabled('q_hunt', false))
    const h = result.current.hunter
    expect(h.hiddenQuestIds).toEqual(['q_train', 'q_hunt'])
    // dailyStatXP is filled in by the one-time history backfill on mount — not by the toggle.
    expect({ ...h, hiddenQuestIds: undefined, dailyStatXP: undefined }).toEqual({
      ...before,
      hiddenQuestIds: undefined,
    })
    expect(stored().hiddenQuestIds).toEqual(['q_train', 'q_hunt'])

    act(() => result.current.setFixedQuestEnabled('q_train', true))
    expect(result.current.hunter.hiddenQuestIds).toEqual(['q_hunt'])
  })

  it('claim and undo behave exactly the same for the quests left visible', () => {
    seed({ hiddenQuestIds: ['q_train', 'q_hunt'] })
    const { result } = renderHook(() => useHunter())
    const q = quest('q_learn')
    act(() => result.current.claimQuest(q, q.tiers[1])) // 30 min / +25
    expect(result.current.hunter).toMatchObject({ xp: 25, completedToday: { q_learn: true } })

    let r: ReturnType<typeof result.current.undoQuestClaim> | undefined
    act(() => {
      r = result.current.undoQuestClaim(q)
    })
    expect(r).toEqual({ ok: true })
    expect(result.current.hunter.xp).toBe(0)
    expect(result.current.hunter.completedToday.q_learn).toBeUndefined()
    expect(result.current.hunter.hiddenQuestIds).toEqual(['q_train', 'q_hunt'])
  })

  it('hiding a quest claimed earlier today keeps its claim, XP and log entry', () => {
    seed({})
    const { result } = renderHook(() => useHunter())
    const q = quest('q_train')
    act(() => result.current.claimQuest(q, q.tiers[0])) // +15
    act(() => result.current.setFixedQuestEnabled('q_train', false))
    expect(result.current.hunter).toMatchObject({ xp: 15, completedToday: { q_train: true } })
    expect(result.current.hunter.log).toHaveLength(1)
  })
})
