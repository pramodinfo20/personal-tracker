// Onboarding's "pick your focus" options — a cosmetic-only, multi-select
// choice. Each maps to a stat that gets slight visual emphasis (see
// focusStats on Hunter — one entry per selected option's stat, in any
// combination); "Balanced" maps to no stat at all.

import type { StatKey } from './types'

export interface FocusOption {
  key: string
  label: string
  description: string
  icon: string
  statKey: StatKey | null
}

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    key: 'physical',
    label: 'Physical',
    description: 'Training, movement, strength',
    icon: '💪',
    statKey: 'STR',
  },
  {
    key: 'mental',
    label: 'Mental',
    description: 'Learning, focus, clarity',
    icon: '🧠',
    statKey: 'INT',
  },
  {
    key: 'career',
    label: 'Career',
    description: 'Job hunting, networking, moves',
    icon: '💼',
    statKey: 'PER',
  },
  {
    key: 'balanced',
    label: 'Balanced',
    description: 'A bit of everything',
    icon: '⚖️',
    statKey: null,
  },
]
