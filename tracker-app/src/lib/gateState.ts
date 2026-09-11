// Shared derivation used by both the Today gate banner and the Level Up
// gate detail card, so "what gate is active/available right now" is only
// computed one way.

import { GATE_TEMPLATES, checkGateUnlock, type ActiveGate, type GateTemplate } from './gates'
import type { Hunter } from './hunterState'

export interface GateState {
  activeGate: ActiveGate | null
  activeTemplate: GateTemplate | null
  availableGate: GateTemplate | null
}

export const deriveGateState = (hunter: Hunter): GateState => {
  const activeGate = hunter.activeGate
  const activeTemplate = activeGate
    ? (GATE_TEMPLATES.find((g) => g.id === activeGate.templateId) ?? null)
    : null
  const availableGate = activeGate
    ? null
    : checkGateUnlock(hunter.level || 1, hunter.clearedGates || [])
  return { activeGate, activeTemplate, availableGate }
}
