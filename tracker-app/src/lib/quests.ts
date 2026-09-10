// Ported as-is from pramod-2026-tracker.html (HUNTER / LEVEL SYSTEM section).

import type { StatKey } from './types'

export interface LogXPTier {
  key: string
  label: string
  xp: number
}

export const LOG_XP_TIERS: LogXPTier[] = [
  { key: 'light', label: 'Light', xp: 10 },
  { key: 'moderate', label: 'Moderate', xp: 20 },
  { key: 'intense', label: 'Intense', xp: 35 },
]

export const DAILY_LOG_CAP = 3

export interface DailyQuest {
  id: string
  icon: string
  label: string
  hint: string
  xp: number
  stat: StatKey
}

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'q_train', icon: '🏃', label: 'Physical Training', hint: 'Workout, run, gym, sports', xp: 25, stat: 'STR' },
  { id: 'q_learn', icon: '📚', label: 'Skill Grinding', hint: 'Learn something new, study, code', xp: 25, stat: 'INT' },
  { id: 'q_hunt', icon: '💼', label: 'Hunter Association', hint: 'Job applications, networking', xp: 20, stat: 'PER' },
  { id: 'q_recover', icon: '🧘', label: 'Recovery Ritual', hint: 'Sleep well, meditate, journal', xp: 15, stat: 'VIT' },
  { id: 'q_discipline', icon: '✅', label: 'Daily Discipline', hint: 'Any other habit or task completed', xp: 10, stat: 'AGI' },
]
