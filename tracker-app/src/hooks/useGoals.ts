// The saved list of goals — same useSaved-backed pattern as
// useJobApplications: it owns the records and nothing else.

import {
  goalDraftToFields,
  validateGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalStatus,
} from '../lib/goals'
import { useSaved } from './useSaved'

const GOALS_KEY = 'p26_goals'

const newId = (): string => `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
const isValid = (draft: GoalDraft) => Object.keys(validateGoalDraft(draft)).length === 0

export function useGoals() {
  const [goals, setGoals] = useSaved<Goal[]>(GOALS_KEY, [])

  // Returns the created goal, or null for a draft that isn't valid.
  const addGoal = (draft: GoalDraft): Goal | null => {
    if (!isValid(draft)) return null
    const created: Goal = { id: newId(), ...goalDraftToFields(draft), createdAt: new Date().toISOString() }
    setGoals((list) => [...list, created])
    return created
  }

  const updateGoal = (id: string, draft: GoalDraft): boolean => {
    if (!isValid(draft)) return false
    setGoals((list) =>
      list.map((g) => (g.id === id ? { id: g.id, createdAt: g.createdAt, ...goalDraftToFields(draft) } : g)),
    )
    return true
  }

  /** The one-tap "mark complete" (and reopen) on a card. */
  const setGoalStatus = (id: string, status: GoalStatus) => {
    setGoals((list) => list.map((g) => (g.id === id ? { ...g, status } : g)))
  }

  const deleteGoal = (id: string) => {
    setGoals((list) => list.filter((g) => g.id !== id))
  }

  return { goals, addGoal, updateGoal, setGoalStatus, deleteGoal }
}
