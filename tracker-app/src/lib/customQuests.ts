// User-defined recurring daily quests, alongside the fixed DAILY_QUESTS in
// quests.ts. Mirrors the Goals/Skills useSaved-list pattern from
// pramod-2026-tracker.html (a plain array of records, CRUD'd by id) rather
// than nesting into Hunter — see hooks/useCustomQuests.ts for the store.

import type { StatKey } from './types'

export interface CustomQuestTier {
  label: string
  xp: number
}

export type QuestCategoryKey = 'hydration' | 'exercise' | 'learning' | 'recovery' | 'custom'

export interface CustomQuest {
  id: string
  name: string
  category: QuestCategoryKey
  iconKey: string
  statKey: StatKey
  tiers: CustomQuestTier[]
  active: boolean
}

// A small fixed icon set (not free-typed emoji) so "iconKey" is a stable
// identifier independent of which glyph renders it — icons can be swapped
// or restyled later without touching stored quest data.
export const QUEST_ICONS: Record<string, string> = {
  droplet: '💧',
  dumbbell: '🏋️',
  book: '📖',
  moon: '🌙',
  star: '⭐',
  run: '🏃',
  brain: '🧠',
  heart: '❤️',
  pen: '📝',
  target: '🎯',
}

export const DEFAULT_ICON_KEY = 'star'

export interface QuestCategoryPreset {
  key: QuestCategoryKey
  label: string
  iconKey: string
  statKey: StatKey
  defaultTiers: CustomQuestTier[]
}

// Prefills for the "add quest" form — picking a category loads sensible
// starting tiers/stat/icon that the user can still edit before saving.
export const QUEST_CATEGORIES: QuestCategoryPreset[] = [
  {
    key: 'hydration',
    label: 'Hydration',
    iconKey: 'droplet',
    statKey: 'VIT',
    defaultTiers: [
      { label: '0.5L', xp: 8 },
      { label: '1L', xp: 15 },
      { label: '2L', xp: 25 },
    ],
  },
  {
    key: 'exercise',
    label: 'Exercise',
    iconKey: 'dumbbell',
    statKey: 'STR',
    defaultTiers: [
      { label: '15 min', xp: 15 },
      { label: '30 min', xp: 25 },
      { label: '45 min', xp: 35 },
      { label: '60 min', xp: 50 },
    ],
  },
  {
    key: 'learning',
    label: 'Reading / Learning',
    iconKey: 'book',
    statKey: 'INT',
    defaultTiers: [
      { label: '10 min', xp: 10 },
      { label: '20 min', xp: 20 },
      { label: '30 min', xp: 30 },
    ],
  },
  {
    key: 'recovery',
    label: 'Sleep / Recovery',
    iconKey: 'moon',
    statKey: 'VIT',
    defaultTiers: [
      { label: 'Wake on time', xp: 15 },
      { label: 'Wake early', xp: 25 },
    ],
  },
  {
    key: 'custom',
    label: 'Custom / Other',
    iconKey: 'star',
    statKey: 'PER',
    defaultTiers: [
      { label: 'Light', xp: 10 },
      { label: 'Moderate', xp: 20 },
      { label: 'Intense', xp: 35 },
    ],
  },
]

export const questCategory = (key: QuestCategoryKey): QuestCategoryPreset =>
  QUEST_CATEGORIES.find((c) => c.key === key) ?? QUEST_CATEGORIES[QUEST_CATEGORIES.length - 1]

export const questIcon = (iconKey: string): string => QUEST_ICONS[iconKey] ?? QUEST_ICONS[DEFAULT_ICON_KEY]

export const activeCustomQuests = (quests: CustomQuest[]): CustomQuest[] =>
  quests.filter((q) => q.active)
