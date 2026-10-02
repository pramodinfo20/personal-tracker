// Originally ported from pramod-2026-tracker.html (HUNTER / LEVEL SYSTEM
// section), where each daily quest paid a single fixed XP value. Every
// XP-earning action now shares one shape: a list of {label, xp} tiers —
// more time/effort = more XP — picked through the one TierPicker component.
// Fixed quests (below), custom quests (customQuests.ts, adapted via
// customQuestToClaimable) and Log Activity (QUEST_CATEGORIES' tiers) all
// use XPTier.

import type { LogEntry } from './hunterState'
import type { StatKey } from './types'

export interface XPTier {
  label: string
  xp: number
}

export const DAILY_LOG_CAP = 3

/**
 * Anything that can be claimed once per day at a tier — the fixed
 * DAILY_QUESTS directly, and custom quests via customQuestToClaimable.
 * useHunter.claimQuest, undoQuestClaim and QuestCards all work on this.
 */
export interface ClaimableQuest {
  id: string
  icon: string
  label: string
  hint: string
  stat: StatKey
  /** A single-tier quest claims in one tap with no picker. */
  tiers: XPTier[]
}

export type DailyQuest = ClaimableQuest

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

// What a day's claims of `quests` actually paid out (default: the fixed
// DAILY_QUESTS, for DayCompleteCard) — replaces the old fixed "sum of every
// quest's xp" now that each claim's XP depends on the tier picked. Custom
// quest claims share the questId field, so scoping by id keeps them out.
export const questXPOnDate = (
  log: LogEntry[],
  dateKey: string,
  quests: Pick<ClaimableQuest, 'id'>[] = DAILY_QUESTS,
): number => {
  const ids = new Set(quests.map((q) => q.id))
  return (log || [])
    .filter((e) => e.questId && ids.has(e.questId) && e.date.slice(0, 10) === dateKey)
    .reduce((sum, e) => sum + e.xp, 0)
}
