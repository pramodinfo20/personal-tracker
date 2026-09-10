import { describe, expect, it, vi } from 'vitest'
import {
  GATE_TEMPLATES,
  checkGateUnlock,
  isGateExpired,
  resolveGateBonusXP,
  startGate,
} from './gates'

describe('checkGateUnlock', () => {
  it('returns null below the first gate unlock level', () => {
    expect(checkGateUnlock(9)).toBeNull()
  })

  it('returns the E-Rank gate at level 10', () => {
    expect(checkGateUnlock(10)?.id).toBe('gate_e')
  })

  it('returns the highest eligible, uncleared gate', () => {
    expect(checkGateUnlock(45)?.id).toBe('gate_b')
  })

  it('skips gates already recorded as cleared', () => {
    expect(checkGateUnlock(45, ['gate_b'])?.id).toBe('gate_c')
  })
})

describe('startGate', () => {
  it('builds an active gate with a deadline duration_hours away', () => {
    const template = GATE_TEMPLATES.find((g) => g.id === 'gate_e')!
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const active = startGate(template)
    expect(active.templateId).toBe('gate_e')
    expect(active.startedAt).toBe(now)
    expect(active.expiresAt).toBe(now + 24 * 3600000)
    expect(active.completedTasks).toEqual({})
    vi.restoreAllMocks()
  })
})

describe('isGateExpired', () => {
  it('is false for null gate', () => {
    expect(isGateExpired(null)).toBe(false)
  })

  it('is false before the deadline and true after', () => {
    const gate = {
      templateId: 'gate_e',
      tier: 'E',
      name: 'E-Rank Gate',
      startedAt: Date.now(),
      expiresAt: Date.now() + 10000,
      completedTasks: {},
    }
    expect(isGateExpired(gate)).toBe(false)
    expect(isGateExpired({ ...gate, expiresAt: Date.now() - 1 })).toBe(true)
  })
})

describe('resolveGateBonusXP', () => {
  it('sums task xp and applies the bonus multiplier, rounded', () => {
    const gateE = GATE_TEMPLATES.find((g) => g.id === 'gate_e')!
    expect(resolveGateBonusXP(gateE)).toBe(120)
    const gateC = GATE_TEMPLATES.find((g) => g.id === 'gate_c')!
    expect(resolveGateBonusXP(gateC)).toBe(275)
  })
})
