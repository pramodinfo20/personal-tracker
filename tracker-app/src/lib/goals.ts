// Goals tracker: the goal record, its validation and ordering. Same shape
// of module as lib/jobApplications.ts (the saved list lives in
// hooks/useGoals.ts). Categories are the onboarding goal categories from
// lib/onboarding.ts — there is no second category list.

import { findActivity, type ActivityCategoryKey } from './activities'
import { isDateKey, localDateKey } from './jobApplications'
import { FIXED_QUEST_GOAL, GOAL_OPTIONS, GOAL_STARTER_ACTIVITY, type GoalOption } from './onboarding'
import { DAILY_QUESTS } from './quests'

export const GOAL_STATUSES = ['not_started', 'in_progress', 'done'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
}

export interface Goal {
  id: string
  title: string
  category: ActivityCategoryKey
  /** Local calendar date, "YYYY-MM-DD". */
  targetDate?: string
  status: GoalStatus
  /** ISO timestamp — orders goals that otherwise tie. */
  createdAt: string
}

/** What the add/edit form produces. */
export interface GoalDraft {
  title: string
  category: ActivityCategoryKey
  /** '' = no target date. */
  targetDate: string
  status: GoalStatus
}

export const GOAL_CATEGORIES: GoalOption[] = GOAL_OPTIONS

export const goalCategory = (key: ActivityCategoryKey): GoalOption =>
  GOAL_CATEGORIES.find((c) => c.key === key) ?? GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1]

const isCategory = (v: unknown): v is ActivityCategoryKey => GOAL_CATEGORIES.some((c) => c.key === v)

export type GoalProblems = Partial<Record<'title' | 'targetDate', string>>

export const validateGoalDraft = (draft: GoalDraft): GoalProblems => ({
  ...(draft.title.trim() ? {} : { title: 'Give the goal a title.' }),
  ...(draft.targetDate === '' || isDateKey(draft.targetDate)
    ? {}
    : { targetDate: "That isn't a valid date." }),
})

// Draft -> the stored fields. Call only with a draft that passed validateGoalDraft.
export const goalDraftToFields = (draft: GoalDraft): Omit<Goal, 'id' | 'createdAt'> => ({
  title: draft.title.trim(),
  category: draft.category,
  status: draft.status,
  ...(draft.targetDate ? { targetDate: draft.targetDate } : {}),
})

export const goalToDraft = (g: Goal): GoalDraft => ({
  title: g.title,
  category: g.category,
  targetDate: g.targetDate ?? '',
  status: g.status,
})

export const emptyGoalDraft = (): GoalDraft => ({
  title: '',
  category: GOAL_CATEGORIES[0].key,
  targetDate: '',
  status: 'not_started',
})

// Incomplete goals first. Among those: soonest target date first, undated
// last. Done goals follow, newest first. Ties fall back to newest created.
export const sortGoals = (list: Goal[]): Goal[] =>
  [...list].sort((a, b) => {
    const aDone = a.status === 'done'
    const bDone = b.status === 'done'
    if (aDone !== bDone) return aDone ? 1 : -1
    if (!aDone) {
      if (a.targetDate && b.targetDate && a.targetDate !== b.targetDate) {
        return a.targetDate.localeCompare(b.targetDate)
      }
      if (Boolean(a.targetDate) !== Boolean(b.targetDate)) return a.targetDate ? -1 : 1
    }
    return b.createdAt.localeCompare(a.createdAt)
  })

export interface GoalCounts {
  active: number
  done: number
}

export const goalCounts = (list: Goal[]): GoalCounts => {
  const done = list.filter((g) => g.status === 'done').length
  return { active: list.length - done, done }
}

/** A target date that has passed on a goal that isn't done. */
export const isOverdue = (goal: Goal, now: Date = new Date()): boolean =>
  goal.status !== 'done' && goal.targetDate !== undefined && goal.targetDate < localDateKey(now)

// The quest that already tracks this kind of goal day to day — the
// built-in quest mapped to the category in onboarding, or the starter
// quest for a category with no built-in one (Hydration -> Drinking Water).
// Informational only.
export const relatedQuestName = (category: ActivityCategoryKey): string | null => {
  const fixed = DAILY_QUESTS.find((q) => FIXED_QUEST_GOAL[q.id] === category)
  if (fixed) return fixed.label
  const starter = GOAL_STARTER_ACTIVITY[category]
  return (starter && findActivity(starter)?.name) || null
}

// ── Validation for backups ──────────────────────────────────────────────

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Why this isn't a usable saved list, or null if it is. */
export const validateGoals = (list: unknown): string | null => {
  if (!Array.isArray(list)) return 'invalid goals'
  for (const g of list) {
    if (!isObject(g) || typeof g.id !== 'string' || typeof g.title !== 'string' || !g.title.trim()) {
      return 'invalid goal'
    }
    if (!isCategory(g.category) || typeof g.createdAt !== 'string') return 'invalid goal'
    if (!(GOAL_STATUSES as readonly unknown[]).includes(g.status)) return 'invalid goal status'
    if (g.targetDate !== undefined && !isDateKey(g.targetDate)) return 'invalid goal date'
  }
  return null
}
