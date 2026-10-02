// A separate, sibling useSaved-backed list — same pattern as the original
// Goals/Skills trackers in pramod-2026-tracker.html (useSaved("p26_goals",
// DG) etc.): a plain array of records, CRUD'd by id, not nested inside
// hunter state. Claiming/undoing a quest's tier still needs to touch
// hunter (XP, log, dailyXP), so that half lives in useHunter.ts — this hook
// only owns quest definitions themselves.
//
// There is deliberately no way to set a quest's tiers or XP from here:
// addQuest builds a quest from an ACTIVITY_LIBRARY id, and the only
// editable field afterwards is the name.

import { findActivity } from '../lib/activities'
import type { CustomQuest } from '../lib/customQuests'
import { useSaved } from './useSaved'

const CUSTOM_QUESTS_KEY = 'p26_custom_quests'

const newQuestId = (): string => `cq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function useCustomQuests() {
  const [customQuests, setCustomQuests] = useSaved<CustomQuest[]>(CUSTOM_QUESTS_KEY, [])

  // Returns the created quest, or null for an id that isn't in the library.
  const addQuest = (activityId: string): CustomQuest | null => {
    const activity = findActivity(activityId)
    if (!activity) return null
    const created: CustomQuest = {
      id: newQuestId(),
      name: activity.name,
      category: activity.category,
      iconKey: activity.iconKey,
      statKey: activity.statKey,
      tiers: activity.tiers.map((t) => ({ ...t })),
      active: true,
      activityId: activity.id,
    }
    setCustomQuests((qs) => [...qs, created])
    return created
  }

  const renameQuest = (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCustomQuests((qs) => qs.map((q) => (q.id === id ? { ...q, name: trimmed } : q)))
  }

  const setQuestActive = (id: string, active: boolean) => {
    setCustomQuests((qs) => qs.map((q) => (q.id === id ? { ...q, active } : q)))
  }

  const deleteQuest = (id: string) => {
    setCustomQuests((qs) => qs.filter((q) => q.id !== id))
  }

  return { customQuests, addQuest, renameQuest, setQuestActive, deleteQuest }
}
