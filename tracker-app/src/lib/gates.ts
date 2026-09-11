// Ported as-is from pramod-2026-tracker.html (GATE SYSTEM section).
// checkGateUnlock: which gate template should be available at this level
// startGate: builds an activeGate instance with a real countdown deadline
// isGateExpired: has the countdown run out
// resolveGateBonusXP: total XP payout for clearing a gate's bundled tasks

import type { StatKey } from './types'

export interface GateTask {
  id: string
  label: string
  stat: StatKey
  xp: number
}

export interface GateTemplate {
  id: string
  tier: string
  name: string
  unlock_level: number
  duration_hours: number
  bonus_multiplier: number
  tasks: GateTask[]
}

export interface ActiveGate {
  templateId: string
  tier: string
  name: string
  startedAt: number
  expiresAt: number
  completedTasks: Record<string, boolean>
}

export const GATE_TEMPLATES: GateTemplate[] = [
  {
    id: 'gate_e',
    tier: 'E',
    name: 'E-Rank Gate',
    unlock_level: 10,
    duration_hours: 24,
    bonus_multiplier: 2,
    tasks: [
      { id: 'gt_e_1', label: 'Clear a full workout', stat: 'STR', xp: 30 },
      { id: 'gt_e_2', label: 'Finish a focused study block', stat: 'INT', xp: 30 },
    ],
  },
  {
    id: 'gate_d',
    tier: 'D',
    name: 'D-Rank Gate',
    unlock_level: 20,
    duration_hours: 24,
    bonus_multiplier: 2,
    tasks: [
      { id: 'gt_d_1', label: 'Apply to 3 jobs', stat: 'PER', xp: 35 },
      { id: 'gt_d_2', label: 'Recovery ritual (sleep/meditate)', stat: 'VIT', xp: 25 },
      { id: 'gt_d_3', label: 'Ship a piece of a side project', stat: 'AGI', xp: 35 },
    ],
  },
  {
    id: 'gate_c',
    tier: 'C',
    name: 'C-Rank Gate',
    unlock_level: 30,
    duration_hours: 48,
    bonus_multiplier: 2.5,
    tasks: [
      { id: 'gt_c_1', label: 'Intense training session', stat: 'STR', xp: 40 },
      { id: 'gt_c_2', label: 'Deep-work skill grind', stat: 'INT', xp: 40 },
      { id: 'gt_c_3', label: 'Network / hunter association', stat: 'PER', xp: 30 },
    ],
  },
  {
    id: 'gate_b',
    tier: 'B',
    name: 'B-Rank Gate',
    unlock_level: 40,
    duration_hours: 48,
    bonus_multiplier: 2.5,
    tasks: [
      { id: 'gt_b_1', label: 'Multi-day training streak', stat: 'STR', xp: 45 },
      { id: 'gt_b_2', label: 'Complete a study milestone', stat: 'INT', xp: 45 },
    ],
  },
  {
    id: 'gate_a',
    tier: 'A',
    name: 'A-Rank Gate',
    unlock_level: 50,
    duration_hours: 72,
    bonus_multiplier: 3,
    tasks: [
      { id: 'gt_a_1', label: 'Push physical limits', stat: 'STR', xp: 50 },
      { id: 'gt_a_2', label: 'Career power move', stat: 'PER', xp: 50 },
      { id: 'gt_a_3', label: 'Full recovery + reflection day', stat: 'VIT', xp: 40 },
    ],
  },
  {
    id: 'gate_s',
    tier: 'S',
    name: 'S-Rank Gate',
    unlock_level: 75,
    duration_hours: 72,
    bonus_multiplier: 3,
    tasks: [
      { id: 'gt_s_1', label: 'National-level training push', stat: 'STR', xp: 60 },
      { id: 'gt_s_2', label: 'Master-level skill grind', stat: 'INT', xp: 60 },
      { id: 'gt_s_3', label: 'Elite hunter networking', stat: 'PER', xp: 50 },
    ],
  },
]

export const checkGateUnlock = (
  level: number,
  clearedGates: string[] = [],
): GateTemplate | null => {
  const eligible = GATE_TEMPLATES.filter(
    (g) => level >= g.unlock_level && !clearedGates.includes(g.id),
  )
  return eligible.length ? eligible[eligible.length - 1] : null
}

export const startGate = (gateTemplate: GateTemplate): ActiveGate => ({
  templateId: gateTemplate.id,
  tier: gateTemplate.tier,
  name: gateTemplate.name,
  startedAt: Date.now(),
  expiresAt: Date.now() + gateTemplate.duration_hours * 3600000,
  completedTasks: {},
})

export const isGateExpired = (activeGate: ActiveGate | null): boolean =>
  !!activeGate && Date.now() > activeGate.expiresAt

export const resolveGateBonusXP = (gateTemplate: GateTemplate): number =>
  Math.round(
    gateTemplate.tasks.reduce((s, t) => s + t.xp, 0) * gateTemplate.bonus_multiplier,
  )
