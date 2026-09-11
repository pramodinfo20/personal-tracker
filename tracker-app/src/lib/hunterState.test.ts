import { describe, expect, it } from 'vitest'
import { DEFAULT_HUNTER } from './hunterState'

describe('DEFAULT_HUNTER', () => {
  it('matches the shape from pramod-2026-tracker.html', () => {
    expect(DEFAULT_HUNTER).toMatchObject({
      name: '',
      level: 1,
      xp: 0,
      statPoints: 0,
      stats: { STR: 10, VIT: 10, INT: 10, PER: 10, AGI: 10 },
      completedToday: {},
      streak: 0,
      syncedDate: null,
      log: [],
      unlockedShadows: [],
      activeGate: null,
      clearedGates: [],
      logCount: 0,
    })
    expect(DEFAULT_HUNTER.lastQuestDate).toBe(new Date().toISOString().split('T')[0])
  })
})
