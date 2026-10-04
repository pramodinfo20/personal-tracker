// @vitest-environment jsdom
// Renaming a custom quest also renames its claims already in the log —
// and changes nothing else about them.
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CustomQuest } from '../lib/customQuests'
import { DEFAULT_HUNTER, type Hunter } from '../lib/hunterState'
import { DAILY_QUESTS } from '../lib/quests'
import { useHunter } from './useHunter'

const NOW = new Date('2026-10-04T12:00:00.000Z')
const TODAY = '2026-10-04'
const water: CustomQuest = {
  id: 'cq_w',
  name: 'Drinking Water',
  category: 'hydration',
  iconKey: 'droplet',
  statKey: 'VIT',
  tiers: [{ label: '1L', xp: 15 }],
  active: true,
  activityId: 'water',
}
const saved = () => JSON.parse(localStorage.getItem('p26_hunter')!) as Hunter

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  const h: Hunter = { ...DEFAULT_HUNTER, name: 'Tester', lastQuestDate: TODAY, dailyXP: {}, dailyStatXP: {} }
  localStorage.setItem('p26_hunter', JSON.stringify(h))
})
afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('useHunter — relabelQuestEntries', () => {
  it("renames that quest's claims in the log, and only the label", () => {
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimCustomQuest(water, water.tiers[0]))
    act(() => result.current.claimQuest(DAILY_QUESTS[0], DAILY_QUESTS[0].tiers[0]))
    const before = saved()

    act(() => result.current.relabelQuestEntries('cq_w', '  Hydrate  '))
    const after = saved()
    const entry = after.log.find((e) => e.questId === 'cq_w')!
    const was = before.log.find((e) => e.questId === 'cq_w')!
    expect(entry).toEqual({ ...was, label: 'Hydrate' })
    // The built-in quest's entry, and every number, are untouched.
    expect(after.log.find((e) => e.questId === DAILY_QUESTS[0].id)).toEqual(
      before.log.find((e) => e.questId === DAILY_QUESTS[0].id),
    )
    expect(after).toMatchObject({ xp: before.xp, level: before.level, stats: before.stats, dailyXP: before.dailyXP })
  })

  it('a renamed claim can still be undone', () => {
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimCustomQuest(water, water.tiers[0]))
    act(() => result.current.relabelQuestEntries('cq_w', 'Hydrate'))
    let undo: ReturnType<typeof result.current.undoQuestClaim> | undefined
    act(() => {
      undo = result.current.undoQuestClaim({ id: 'cq_w' })
    })
    expect(undo).toEqual({ ok: true })
    expect(saved().xp).toBe(0)
    expect(saved().log).toEqual([])
  })

  it('ignores a blank name and a quest with no entries', () => {
    const { result } = renderHook(() => useHunter())
    act(() => result.current.claimCustomQuest(water, water.tiers[0]))
    const before = localStorage.getItem('p26_hunter')
    act(() => result.current.relabelQuestEntries('cq_w', '   '))
    act(() => result.current.relabelQuestEntries('cq_other', 'Whatever'))
    expect(localStorage.getItem('p26_hunter')).toBe(before)
  })
})
