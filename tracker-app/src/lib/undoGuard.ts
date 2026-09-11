// Undoing a quest claim can roll the level back down (see reverseXPGain).
// If that new, lower level is below something the hunter has ALREADY
// unlocked/cleared/started on the strength of the XP now being removed —
// a gate's clearedGates entry, an active gate in progress, or a shadow
// milestone — the resulting state would be self-contradictory (e.g. a
// cleared C-Rank Gate on a hunter who, per their level, was never eligible
// for it). Rather than guessing how to reconcile that (revoke the gate?
// the shadow? let it stand?), this only detects the conflict so the
// caller can refuse the undo and surface it — a real product decision,
// not something to silently paper over.

import { GATE_TEMPLATES } from './gates'
import type { Hunter } from './hunterState'
import { SHADOW_MILESTONES } from './shadows'

export const wouldStrandProgress = (hunter: Hunter, newLevel: number): string | null => {
  for (const gateId of hunter.clearedGates || []) {
    const template = GATE_TEMPLATES.find((g) => g.id === gateId)
    if (template && newLevel < template.unlock_level) {
      return `clearing "${template.name}" (needs level ${template.unlock_level})`
    }
  }

  if (hunter.activeGate) {
    const template = GATE_TEMPLATES.find((g) => g.id === hunter.activeGate?.templateId)
    if (template && newLevel < template.unlock_level) {
      return `the active "${template.name}" gate (needs level ${template.unlock_level})`
    }
  }

  for (const milestoneLevel of hunter.unlockedShadows || []) {
    if (newLevel < milestoneLevel) {
      const shadow = SHADOW_MILESTONES.find((s) => s.level === milestoneLevel)
      return `unlocking ${shadow ? shadow.name : `the level ${milestoneLevel} shadow`}`
    }
  }

  return null
}
