import { describe, expect, it } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from './hunterState'
import { deriveGateState } from './gateState'

describe('deriveGateState', () => {
  it('has neither active nor available gate below the first unlock level', () => {
    const state = deriveGateState({ ...DEFAULT_HUNTER, level: 1 })
    expect(state.activeGate).toBeNull()
    expect(state.availableGate).toBeNull()
  })

  it('surfaces the available gate once the unlock level is reached', () => {
    const state = deriveGateState({ ...DEFAULT_HUNTER, level: 10 })
    expect(state.availableGate?.id).toBe('gate_e')
    expect(state.activeGate).toBeNull()
  })

  it('resolves the active template from hunter.activeGate', () => {
    const hunter: Hunter = {
      ...DEFAULT_HUNTER,
      level: 10,
      activeGate: {
        templateId: 'gate_e',
        tier: 'E',
        name: 'E-Rank Gate',
        startedAt: Date.now(),
        expiresAt: Date.now() + 1000,
        completedTasks: {},
      },
    }
    const state = deriveGateState(hunter)
    expect(state.activeTemplate?.id).toBe('gate_e')
    expect(state.availableGate).toBeNull()
  })
})
