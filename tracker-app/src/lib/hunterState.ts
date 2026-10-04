// Ported as-is from pramod-2026-tracker.html — the localStorage-backed
// `hunter` state shape (DEFAULT_HUNTER) plus its supporting types.

import type { ActivityCategoryKey } from './activities'
import type { ActiveGate } from './gates'
import type { DailyStatXP } from './statHistory'
import type { StatKey } from './types'

export type { StatKey } from './types'

export interface LogEntry {
  id: number
  date: string
  label: string
  xp: number
  stat: StatKey | 'GATE'
  /** Present only for entries created by claiming a daily quest — lets undo find the exact entry to reverse without guessing from label/xp/stat. */
  questId?: string
  /**
   * The {label, xp} tier picked when this entry was created (e.g. "30 min").
   * Absent on entries from before tiers existed — those only ever had a
   * fixed xp — so anything displaying this must treat it as optional.
   */
  tier?: string
  /** Present only for Log Activity entries — the logged activity's ACTIVITY_CATEGORIES key. */
  category?: string
}

export interface StatMeta {
  key: StatKey
  label: string
  icon: string
  color: string
}

export const STAT_META: StatMeta[] = [
  { key: 'STR', label: 'Strength', icon: '💪', color: 'var(--color-stat-str)' },
  { key: 'VIT', label: 'Vitality', icon: '❤️', color: 'var(--color-stat-vit)' },
  { key: 'INT', label: 'Intelligence', icon: '🧠', color: 'var(--color-stat-int)' },
  { key: 'PER', label: 'Perception', icon: '👁️', color: 'var(--color-stat-per)' },
  { key: 'AGI', label: 'Agility', icon: '⚡', color: 'var(--color-stat-agi)' },
]

export interface Hunter {
  name: string
  level: number
  xp: number
  statPoints: number
  stats: Record<StatKey, number>
  completedToday: Record<string, boolean>
  lastQuestDate: string
  /**
   * Legacy day counter, still written at day rollover but no longer shown
   * anywhere: every streak on screen is currentStreak(dailyXP) from
   * lib/progress.ts, which can't drift. Kept so existing saves and backups
   * keep their shape.
   */
  streak: number
  syncedDate: string | null
  log: LogEntry[]
  /**
   * Uncapped per-day XP totals, keyed by the same UTC date string
   * today()/LogEntry.date use ("YYYY-MM-DD"). Updated alongside every
   * hunter.log write (grantXP, completeGateTask, handleGateExpire) so it
   * never loses history to the 40-entry log cap — this is what the
   * Progress screen's Week/Month/Year aggregation reads from. A key is
   * always present for any day with an entry, even a 0-XP one (e.g. a
   * failed gate), so "days active" stays correct.
   */
  dailyXP: Record<string, number>
  /**
   * Uncapped per-day, per-stat XP — dailyXP split by stat, so the Progress
   * tab's stat breakdown isn't limited to the 40-entry log. Written and
   * reversed everywhere dailyXP is. Absent on older saves until useHunter's
   * one-time backfill runs. See lib/statHistory.ts.
   */
  dailyStatXP?: DailyStatXP
  unlockedShadows: number[]
  activeGate: ActiveGate | null
  clearedGates: string[]
  logCount: number
  /** Cosmetic-only "focus" chosen during onboarding — which stats get slight visual emphasis. Multi-select: any number of stats, including none (e.g. only "Balanced" picked, or a hunter who predates onboarding). */
  focusStats: StatKey[]
  /**
   * Ids of fixed DAILY_QUESTS the user has hidden from Today (Manage
   * Quests). Absent on older saves = nothing hidden. Custom quests don't
   * appear here — they carry their own `active` flag. See lib/questVisibility.ts.
   */
  hiddenQuestIds?: string[]
  /** Optional profile details from setup — display only, never used in any XP/health calculation. */
  age?: number
  heightCm?: number
  weightKg?: number
  /** Goal categories picked in setup (activity-library category keys). Absent for hunters who onboarded before goals existed. */
  goals?: ActivityCategoryKey[]
  /** ISO timestamp of finishing onboarding. Absent for hunters who onboarded before this was tracked — see joinDateFor in lib/profile.ts. */
  joinedAt?: string
  /**
   * Profile photo: a small square JPEG data URL produced by resizeToAvatar
   * (lib/avatar.ts). Absent = the letter avatar. Lives on the save itself,
   * so it's backed up and restored with everything else.
   */
  photo?: string
}

export const DEFAULT_HUNTER: Hunter = {
  name: '',
  level: 1,
  xp: 0,
  statPoints: 0,
  stats: { STR: 10, VIT: 10, INT: 10, PER: 10, AGI: 10 },
  completedToday: {},
  lastQuestDate: new Date().toISOString().split('T')[0],
  streak: 0,
  syncedDate: null,
  log: [],
  dailyXP: {},
  unlockedShadows: [],
  activeGate: null,
  clearedGates: [],
  logCount: 0,
  focusStats: [],
}
