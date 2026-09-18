// @vitest-environment jsdom
// Focused on the highest-risk new logic from this phase: a custom quest's
// tier-based XP grant and its same-day undo. Fixed-quest claim/undo (an
// existing, unmodified path) gets one smoke test to confirm this phase
// left it alone.
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { CustomQuest } from '../lib/customQuests'
import { DAILY_QUESTS } from '../lib/quests'
import { xpForLevel } from '../lib/leveling'
import { useHunter } from './useHunter'

const HYDRATION_QUEST: CustomQuest = {
  id: 'cq_hydration',
  name: 'Hydration',
  category: 'hydration',
  iconKey: 'droplet',
  statKey: 'VIT',
  tiers: [
    { label: '0.5L', xp: 8 },
    { label: '1L', xp: 15 },
    { label: '2L', xp: 25 },
  ],
  active: true,
}

describe('useHunter — custom quest claim/undo', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('claimCustomQuest grants the selected tier\'s xp, stat, and marks it done for today', () => {
    const { result } = renderHook(() => useHunter())
    const startXp = result.current.hunter.xp
    const startVit = result.current.hunter.stats.VIT

    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[1]) // 1L, +15
    })

    expect(result.current.hunter.xp).toBe(startXp + 15)
    expect(result.current.hunter.stats.VIT).toBe(startVit + 1)
    expect(result.current.hunter.completedToday[HYDRATION_QUEST.id]).toBe(true)

    const entry = result.current.hunter.log[0]
    expect(entry.xp).toBe(15)
    expect(entry.stat).toBe('VIT')
    expect(entry.label).toBe('Hydration — 1L')
    expect(entry.questId).toBe(HYDRATION_QUEST.id)
  })

  it('records the claimed tier\'s xp in dailyXP for today', () => {
    const { result } = renderHook(() => useHunter())
    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[2]) // 2L, +25
    })
    const todayKey = new Date().toISOString().slice(0, 10)
    expect(result.current.hunter.dailyXP[todayKey]).toBe(25)
  })

  it('is a no-op if the quest is already claimed today (one-claim-per-day)', () => {
    const { result } = renderHook(() => useHunter())
    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[0])
    })
    const xpAfterFirst = result.current.hunter.xp
    const logLengthAfterFirst = result.current.hunter.log.length

    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[2]) // different tier, same quest
    })

    expect(result.current.hunter.xp).toBe(xpAfterFirst)
    expect(result.current.hunter.log.length).toBe(logLengthAfterFirst)
  })

  it('is a no-op for an inactive (deactivated) quest', () => {
    const { result } = renderHook(() => useHunter())
    const inactive = { ...HYDRATION_QUEST, active: false }
    act(() => {
      result.current.claimCustomQuest(inactive, inactive.tiers[0])
    })
    expect(result.current.hunter.log).toHaveLength(0)
    expect(result.current.hunter.completedToday[inactive.id]).toBeUndefined()
  })

  it('undoCustomQuestClaim fully reverses the claim: xp, stat, log, dailyXP, completedToday', () => {
    const { result } = renderHook(() => useHunter())
    const startXp = result.current.hunter.xp
    const startVit = result.current.hunter.stats.VIT

    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[1]) // +15
    })

    let undoResult
    act(() => {
      undoResult = result.current.undoCustomQuestClaim(HYDRATION_QUEST)
    })

    expect(undoResult).toEqual({ ok: true })
    expect(result.current.hunter.xp).toBe(startXp)
    expect(result.current.hunter.stats.VIT).toBe(startVit)
    expect(result.current.hunter.completedToday[HYDRATION_QUEST.id]).toBeUndefined()
    expect(result.current.hunter.log.find((e) => e.questId === HYDRATION_QUEST.id)).toBeUndefined()

    const todayKey = new Date().toISOString().slice(0, 10)
    expect(result.current.hunter.dailyXP[todayKey] ?? 0).toBe(0)
  })

  it('undo uses the xp/stat actually LOGGED at claim time, not the quest\'s current (possibly edited) stat', () => {
    const { result } = renderHook(() => useHunter())
    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[1]) // logged as VIT, +15
    })
    const vitAfterClaim = result.current.hunter.stats.VIT
    const strBeforeUndo = result.current.hunter.stats.STR

    // Simulate the quest having been edited (e.g. stat changed) after the
    // claim but before the undo — the passed-in quest object now says STR.
    const editedQuest: CustomQuest = { ...HYDRATION_QUEST, statKey: 'STR' }

    act(() => {
      result.current.undoCustomQuestClaim(editedQuest)
    })

    // STR (the edited/current stat) must be untouched...
    expect(result.current.hunter.stats.STR).toBe(strBeforeUndo)
    // ...and VIT (what was actually logged) is what gets decremented.
    expect(result.current.hunter.stats.VIT).toBe(vitAfterClaim - 1)
  })

  it('undoCustomQuestClaim refuses when nothing was claimed today', () => {
    const { result } = renderHook(() => useHunter())
    let undoResult
    act(() => {
      undoResult = result.current.undoCustomQuestClaim(HYDRATION_QUEST)
    })
    expect(undoResult).toEqual({ ok: false, reason: 'Nothing to undo.' })
  })

  it('after undo, the same quest can be claimed again the same day', () => {
    const { result } = renderHook(() => useHunter())
    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[0])
    })
    act(() => {
      result.current.undoCustomQuestClaim(HYDRATION_QUEST)
    })
    act(() => {
      result.current.claimCustomQuest(HYDRATION_QUEST, HYDRATION_QUEST.tiers[2])
    })
    expect(result.current.hunter.completedToday[HYDRATION_QUEST.id]).toBe(true)
    expect(result.current.hunter.log[0].xp).toBe(25)
  })

  it('refuses an undo that would strand already-unlocked progress', () => {
    // Seed a hunter 5xp shy of level 5, with the level-5 shadow milestone
    // already unlocked — claiming a 10xp tier crosses into level 5, so
    // undoing it would drop back below the milestone's requirement. There's
    // no public "set level" API on the hook (state only moves through
    // grantXP-shaped actions), so seed this directly in localStorage before
    // mount, the same way undoGuard.test.ts constructs its conflict cases.
    const seeded: CustomQuest = { ...HYDRATION_QUEST, tiers: [{ label: 'Big', xp: 10 }] }
    localStorage.setItem(
      'p26_hunter',
      JSON.stringify({
        name: 'Test',
        level: 4,
        xp: xpForLevel(4) - 5,
        statPoints: 0,
        stats: { STR: 10, VIT: 10, INT: 10, PER: 10, AGI: 10 },
        completedToday: {},
        lastQuestDate: new Date().toISOString().split('T')[0],
        streak: 0,
        syncedDate: null,
        log: [],
        dailyXP: {},
        unlockedShadows: [5],
        activeGate: null,
        clearedGates: [],
        logCount: 0,
        focusStats: [],
      }),
    )
    const { result: seededResult } = renderHook(() => useHunter())
    act(() => {
      seededResult.current.claimCustomQuest(seeded, seeded.tiers[0]) // +10 crosses into level 5
    })
    expect(seededResult.current.hunter.level).toBe(5)

    let undoResult
    act(() => {
      undoResult = seededResult.current.undoCustomQuestClaim(seeded)
    })
    expect((undoResult as unknown as { ok: boolean }).ok).toBe(false)
    expect((undoResult as unknown as { reason: string }).reason).toMatch(/Ash Wolf/)
    // Refused — state must be unchanged.
    expect(seededResult.current.hunter.level).toBe(5)
    expect(seededResult.current.hunter.completedToday[seeded.id]).toBe(true)
  })
})

describe('useHunter — fixed DAILY_QUESTS are unaffected', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('claimQuest/undoQuestClaim still work exactly as before for a fixed quest', () => {
    const { result } = renderHook(() => useHunter())
    const quest = DAILY_QUESTS[0]
    const startXp = result.current.hunter.xp

    act(() => {
      result.current.claimQuest(quest)
    })
    expect(result.current.hunter.xp).toBe(startXp + quest.xp)
    expect(result.current.hunter.completedToday[quest.id]).toBe(true)

    let undoResult
    act(() => {
      undoResult = result.current.undoQuestClaim(quest)
    })
    expect(undoResult).toEqual({ ok: true })
    expect(result.current.hunter.xp).toBe(startXp)
    expect(result.current.hunter.completedToday[quest.id]).toBeUndefined()
  })
})
