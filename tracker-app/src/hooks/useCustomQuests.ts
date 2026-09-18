// A separate, sibling useSaved-backed list — same pattern as the original
// Goals/Skills trackers in pramod-2026-tracker.html (useSaved("p26_goals",
// DG) etc.): a plain array of records, CRUD'd by id, not nested inside
// hunter state. Claiming/undoing a quest's tier still needs to touch
// hunter (XP, log, dailyXP), so that half lives in useHunter.ts — this hook
// only owns quest definitions themselves.

import type { CustomQuest, CustomQuestTier, QuestCategoryKey } from '../lib/customQuests'
import { useSaved } from './useSaved'
import type { StatKey } from '../lib/types'

const CUSTOM_QUESTS_KEY = 'p26_custom_quests'

export interface NewCustomQuest {
  name: string
  category: QuestCategoryKey
  iconKey: string
  statKey: StatKey
  tiers: CustomQuestTier[]
}

const newQuestId = (): string => `cq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function useCustomQuests() {
  const [customQuests, setCustomQuests] = useSaved<CustomQuest[]>(CUSTOM_QUESTS_KEY, [])

  const addQuest = (quest: NewCustomQuest) => {
    const created: CustomQuest = { ...quest, id: newQuestId(), active: true }
    setCustomQuests((qs) => [...qs, created])
    return created
  }

  const updateQuest = (id: string, patch: Partial<NewCustomQuest>) => {
    setCustomQuests((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const setQuestActive = (id: string, active: boolean) => {
    setCustomQuests((qs) => qs.map((q) => (q.id === id ? { ...q, active } : q)))
  }

  const deleteQuest = (id: string) => {
    setCustomQuests((qs) => qs.filter((q) => q.id !== id))
  }

  return { customQuests, addQuest, updateQuest, setQuestActive, deleteQuest }
}
