// User-defined recurring daily quests, alongside the fixed DAILY_QUESTS in
// quests.ts. Mirrors the Goals/Skills useSaved-list pattern from
// pramod-2026-tracker.html (a plain array of records, CRUD'd by id) rather
// than nesting into Hunter — see hooks/useCustomQuests.ts for the store.
//
// New quests are created only from ACTIVITY_LIBRARY (activities.ts), which
// supplies their name, icon, stat and fixed tiers. Quests saved before the
// library existed have no activityId and keep the tiers they were saved
// with — those stay valid and claimable exactly as before.

import { activityCategory, type ActivityCategoryKey } from './activities'
import type { ClaimableQuest, XPTier } from './quests'
import type { StatKey } from './types'

export type QuestCategoryKey = ActivityCategoryKey

export interface CustomQuest {
  id: string
  name: string
  category: QuestCategoryKey
  iconKey: string
  statKey: StatKey
  tiers: XPTier[]
  active: boolean
  /** The ACTIVITY_LIBRARY entry this quest was created from. Absent on pre-library quests. */
  activityId?: string
}

// A small fixed icon set (not free-typed emoji) so "iconKey" is a stable
// identifier independent of which glyph renders it — icons can be swapped
// or restyled later without touching stored quest data. The first ten keys
// predate the activity library and may be referenced by saved quests.
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
  bike: '🚴',
  yoga: '🤸',
  walk: '🚶',
  swim: '🏊',
  code: '💻',
  speech: '🗣️',
  meditate: '🧘',
  briefcase: '💼',
  handshake: '🤝',
}

export const DEFAULT_ICON_KEY = 'star'

export const questCategoryLabel = (key: QuestCategoryKey): string => activityCategory(key).label

export const questIcon = (iconKey: string): string => QUEST_ICONS[iconKey] ?? QUEST_ICONS[DEFAULT_ICON_KEY]

export const activeCustomQuests = (quests: CustomQuest[]): CustomQuest[] =>
  quests.filter((q) => q.active)

// Adapts a stored custom quest to the shape the shared claim/undo path and
// QuestCards use, so custom quests never need a parallel implementation.
export const customQuestToClaimable = (q: CustomQuest): ClaimableQuest => ({
  id: q.id,
  icon: questIcon(q.iconKey),
  label: q.name,
  hint: questCategoryLabel(q.category),
  stat: q.statKey,
  tiers: q.tiers,
})
