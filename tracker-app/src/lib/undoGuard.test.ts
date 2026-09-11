import { describe, expect, it } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from './hunterState'
import { wouldStrandProgress } from './undoGuard'

describe('wouldStrandProgress', () => {
  it('allows the drop when nothing has been unlocked yet', () => {
    expect(wouldStrandProgress(DEFAULT_HUNTER, 1)).toBeNull()
  })

  it('flags a cleared gate whose unlock level is now out of reach', () => {
    const hunter: Hunter = { ...DEFAULT_HUNTER, clearedGates: ['gate_e'] } // E-Rank Gate needs level 10
    expect(wouldStrandProgress(hunter, 9)).toMatch(/E-Rank Gate/)
    expect(wouldStrandProgress(hunter, 10)).toBeNull()
  })

  it('flags an active gate whose unlock level is now out of reach', () => {
    const hunter: Hunter = {
      ...DEFAULT_HUNTER,
      activeGate: {
        templateId: 'gate_d', // D-Rank Gate needs level 20
        tier: 'D',
        name: 'D-Rank Gate',
        startedAt: Date.now(),
        expiresAt: Date.now() + 1000,
        completedTasks: {},
      },
    }
    expect(wouldStrandProgress(hunter, 19)).toMatch(/D-Rank Gate/)
    expect(wouldStrandProgress(hunter, 20)).toBeNull()
  })

  it('flags an unlocked shadow milestone now out of reach', () => {
    const hunter: Hunter = { ...DEFAULT_HUNTER, unlockedShadows: [5] } // Ash Wolf at level 5
    expect(wouldStrandProgress(hunter, 4)).toMatch(/Ash Wolf/)
    expect(wouldStrandProgress(hunter, 5)).toBeNull()
  })

  it('checks every cleared gate, not just the first', () => {
    const hunter: Hunter = { ...DEFAULT_HUNTER, clearedGates: ['gate_e', 'gate_d'] }
    // Below gate_d's level (20) but still above gate_e's (10) — still a conflict.
    expect(wouldStrandProgress(hunter, 15)).toMatch(/D-Rank Gate/)
  })
})
