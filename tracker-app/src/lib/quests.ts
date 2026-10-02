// Originally ported from pramod-2026-tracker.html (HUNTER / LEVEL SYSTEM
// section), where each daily quest paid a single fixed XP value and Log
// Activity used generic Light/Moderate/Intense buttons. Both now share one
// shape: a list of {label, xp} tiers — more time/effort = more XP — picked
// by the same TierPicker component.

import type { LogEntry } from './hunterState'
import type { StatKey } from './types'

export interface XPTier {
  label: string
  xp: number
}

export const DAILY_LOG_CAP = 3

export interface DailyQuest {
  id: string
  icon: string
  label: string
  hint: string
  stat: StatKey
  /** Ascending by xp. A single-tier quest claims in one tap with no picker. */
  tiers: XPTier[]
}

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'q_train',
    icon: '🏃',
    label: 'Physical Training',
    hint: 'Workout, run, gym, sports',
    stat: 'STR',
    tiers: [
      { label: '15 min', xp: 15 },
      { label: '30 min', xp: 25 },
      { label: '45 min', xp: 35 },
      { label: '60+ min', xp: 50 },
    ],
  },
  {
    id: 'q_learn',
    icon: '📚',
    label: 'Skill Grinding',
    hint: 'Learn something new, study, code',
    stat: 'INT',
    tiers: [
      { label: '15 min', xp: 15 },
      { label: '30 min', xp: 25 },
      { label: '60+ min', xp: 40 },
    ],
  },
  {
    id: 'q_hunt',
    icon: '💼',
    label: 'Hunter Association',
    hint: 'Job applications, networking',
    stat: 'PER',
    tiers: [
      { label: '1–2 actions', xp: 15 },
      { label: '3–4 actions', xp: 20 },
      { label: '5+ actions', xp: 30 },
    ],
  },
  {
    id: 'q_recover',
    icon: '🧘',
    label: 'Recovery Ritual',
    hint: 'Sleep well, meditate, journal',
    stat: 'VIT',
    tiers: [{ label: 'Done', xp: 15 }],
  },
  {
    id: 'q_discipline',
    icon: '✅',
    label: 'Daily Discipline',
    hint: 'Any other habit or task completed',
    stat: 'AGI',
    tiers: [{ label: 'Done', xp: 10 }],
  },
]

export interface LogCategory {
  id: string
  icon: string
  label: string
  stat: StatKey
  tiers: XPTier[]
}

// Log Activity's categories — same {label, xp} tier shape as DAILY_QUESTS.
// XP is deliberately a notch below the matching daily quest's tiers: these
// are extras on top of the day's quests (and capped at DAILY_LOG_CAP).
export const LOG_CATEGORIES: LogCategory[] = [
  {
    id: 'exercise',
    icon: '🏋️',
    label: 'Exercise',
    stat: 'STR',
    tiers: [
      { label: '15 min', xp: 10 },
      { label: '30 min', xp: 20 },
      { label: '60+ min', xp: 35 },
    ],
  },
  {
    id: 'reading',
    icon: '📖',
    label: 'Reading',
    stat: 'INT',
    tiers: [
      { label: '15 min', xp: 10 },
      { label: '30 min', xp: 20 },
      { label: '60+ min', xp: 35 },
    ],
  },
  {
    id: 'networking',
    icon: '🤝',
    label: 'Networking',
    stat: 'PER',
    tiers: [
      { label: '1–2 actions', xp: 10 },
      { label: '3–4 actions', xp: 15 },
      { label: '5+ actions', xp: 25 },
    ],
  },
  {
    id: 'hydration',
    icon: '💧',
    label: 'Hydration',
    stat: 'VIT',
    tiers: [
      { label: '1 L', xp: 5 },
      { label: '2 L', xp: 10 },
      { label: '3+ L', xp: 15 },
    ],
  },
  {
    id: 'mindfulness',
    icon: '🧘',
    label: 'Mindfulness',
    stat: 'VIT',
    tiers: [
      { label: '5 min', xp: 5 },
      { label: '10 min', xp: 10 },
      { label: '20+ min', xp: 20 },
    ],
  },
  {
    id: 'chores',
    icon: '🧹',
    label: 'Chores & Errands',
    stat: 'AGI',
    tiers: [
      { label: '15 min', xp: 10 },
      { label: '30 min', xp: 20 },
      { label: '60+ min', xp: 30 },
    ],
  },
]

// Claims/logs only ever accept a tier that's actually in the quest's or
// category's own list — a stale or hand-crafted tier can't mint arbitrary XP.
export const isValidTier = (tiers: XPTier[], tier: XPTier): boolean =>
  tiers.some((t) => t.label === tier.label && t.xp === tier.xp)

export const tierXPRange = (tiers: XPTier[]): { min: number; max: number } => {
  const xps = tiers.map((t) => t.xp)
  return { min: Math.min(...xps), max: Math.max(...xps) }
}

// "+15" for a single tier, "+15–50" for several.
export const formatTierXPRange = (tiers: XPTier[]): string => {
  const { min, max } = tierXPRange(tiers)
  return min === max ? `+${min}` : `+${min}–${max}`
}

export const allQuestsClaimed = (completedToday: Record<string, boolean>): boolean =>
  DAILY_QUESTS.every((q) => !!completedToday?.[q.id])

// The log entry backing a quest claimed today (newest first, so the first
// match is today's). Works for both old entries (xp only, no tier) and new
// ones (with tier) — the XP that was actually granted always lives on the
// entry, never re-derived from the current tier tables.
export const questClaimEntry = (
  log: LogEntry[],
  questId: string,
  dateKey: string,
): LogEntry | undefined =>
  (log || []).find((e) => e.questId === questId && e.date.slice(0, 10) === dateKey)

// What today's daily-quest claims actually paid out — replaces the old
// fixed "sum of every quest's xp" now that each claim's XP depends on the
// tier picked.
export const questXPOnDate = (log: LogEntry[], dateKey: string): number =>
  (log || [])
    .filter((e) => e.questId && e.date.slice(0, 10) === dateKey)
    .reduce((sum, e) => sum + e.xp, 0)
