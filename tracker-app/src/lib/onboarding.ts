// First-launch setup: what it collects and how the chosen goals turn into
// starting defaults. Goals are the activity library's own categories
// (activities.ts) — onboarding doesn't invent a second category list — and
// the quest defaults are written into the existing hiddenQuestIds mechanism
// (questVisibility.ts), so Manage Quests can change any of it afterwards.

import { ACTIVITY_CATEGORIES, type ActivityCategory, type ActivityCategoryKey } from './activities'
import { DAILY_QUESTS } from './quests'
import type { StatKey } from './types'

export interface GoalOption {
  key: ActivityCategoryKey
  /** Goal-flavored label for the setup screen (the library's label is activity-flavored). */
  label: string
  description: string
  category: ActivityCategory
}

const GOAL_COPY: Record<ActivityCategoryKey, { label: string; description: string }> = {
  exercise: { label: 'Physical / Fitness', description: 'Training, movement, strength' },
  learning: { label: 'Skills / Learning', description: 'Study, reading, practice' },
  career: { label: 'Career / Networking', description: 'Applications, contacts, interviews' },
  recovery: { label: 'Mindfulness / Recovery', description: 'Sleep, meditation, journaling' },
  hydration: { label: 'Hydration', description: 'Drinking enough water' },
  custom: { label: 'Daily Habits', description: 'Everyday tasks and discipline' },
}

// One goal per activity-library category, in a setup-friendly order.
const GOAL_ORDER: ActivityCategoryKey[] = [
  'exercise',
  'learning',
  'career',
  'recovery',
  'hydration',
  'custom',
]

export const GOAL_OPTIONS: GoalOption[] = GOAL_ORDER.map((key) => ({
  key,
  ...GOAL_COPY[key],
  category: ACTIVITY_CATEGORIES.find((c) => c.key === key)!,
}))

// Which goal each fixed daily quest belongs to. A quest starts hidden when
// its goal wasn't picked.
export const FIXED_QUEST_GOAL: Record<string, ActivityCategoryKey> = {
  q_train: 'exercise', // Physical Training
  q_learn: 'learning', // Skill Grinding
  q_hunt: 'career', // Hunter Association
  q_recover: 'recovery', // Recovery Ritual
  q_discipline: 'custom', // Daily Discipline
}

// Goals with no fixed quest behind them get a starter quest from the
// activity library instead, so picking them isn't a no-op.
export const GOAL_STARTER_ACTIVITY: Partial<Record<ActivityCategoryKey, string>> = {
  hydration: 'water',
}

// The hiddenQuestIds a set of goals implies: every fixed quest whose goal
// wasn't selected.
export const hiddenQuestIdsForGoals = (goals: ActivityCategoryKey[]): string[] =>
  DAILY_QUESTS.filter((q) => !goals.includes(FIXED_QUEST_GOAL[q.id])).map((q) => q.id)

// Library activity ids to add as starter quests for these goals.
export const starterActivitiesForGoals = (goals: ActivityCategoryKey[]): string[] =>
  goals.flatMap((g) => (GOAL_STARTER_ACTIVITY[g] ? [GOAL_STARTER_ACTIVITY[g]] : []))

const GOAL_STAT: Record<ActivityCategoryKey, StatKey> = {
  exercise: 'STR',
  learning: 'INT',
  career: 'PER',
  recovery: 'VIT',
  hydration: 'VIT',
  custom: 'AGI',
}

// The cosmetic stat emphasis (Hunter.focusStats) the goals imply — this
// replaces the old standalone "pick your focus" step.
export const focusStatsForGoals = (goals: ActivityCategoryKey[]): StatKey[] => [
  ...new Set(goals.map((g) => GOAL_STAT[g])),
]

export interface BodyField {
  key: 'age' | 'heightCm' | 'weightKg'
  label: string
  unit: string
  min: number
  max: number
}

// Display-only profile details — never used in any XP or health calculation.
export const BODY_FIELDS: BodyField[] = [
  { key: 'age', label: 'Age', unit: 'yrs', min: 5, max: 120 },
  { key: 'heightCm', label: 'Height', unit: 'cm', min: 50, max: 260 },
  { key: 'weightKg', label: 'Weight', unit: 'kg', min: 20, max: 400 },
]

export interface ParsedOptionalNumber {
  /** undefined when blank (it's optional) or invalid. */
  value: number | undefined
  /** false only when something was typed that isn't a number in range. */
  valid: boolean
}

export const parseOptionalNumber = (raw: string, min: number, max: number): ParsedOptionalNumber => {
  const trimmed = raw.trim()
  if (!trimmed) return { value: undefined, valid: true }
  const n = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(n) || n < min || n > max) return { value: undefined, valid: false }
  return { value: Math.round(n * 10) / 10, valid: true }
}

/** Everything the setup flow hands back on completion. */
export interface OnboardingResult {
  name: string
  age?: number
  heightCm?: number
  weightKg?: number
  goals: ActivityCategoryKey[]
}
