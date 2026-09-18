// Pure visual metadata for the Today screen's quest cards — which category
// art a quest renders with, and what that category's color/gradient/glow
// look like. Nothing here touches gameplay: it only decides appearance.
//
// Custom quests already carry a QuestCategoryKey (customQuests.ts). Fixed
// DAILY_QUESTS don't have a category field — that's a custom-quest-only
// concept — so two of the five (Hunter Association, Daily Discipline) get
// their own dedicated art ('career', 'discipline') rather than being
// force-fit into an existing custom category they don't really match. The
// other three fixed quests share art with the custom category they're
// conceptually the same thing as (Physical Training = Exercise, etc.),
// which is the point — a custom "Exercise" quest should look like the
// fixed Exercise quest.

import type { QuestCategoryKey } from './customQuests'

export type QuestArtKey = QuestCategoryKey | 'career' | 'discipline'

export interface QuestArt {
  key: QuestArtKey
  label: string
  /** Solid accent — icon ring, tier-button text, category label. */
  color: string
  /** Same hue, low alpha — the card's background gradient tint. */
  tint: string
  /** Same hue, higher alpha — border/tier-button resting outline. */
  border: string
  /** Precomputed box-shadow (mirrors the --shadow-glow-* tokens in index.css) — a single CSS var reference keeps the Tailwind arbitrary-value class simple. */
  glowShadow: string
}

const art = (key: QuestArtKey, label: string, color: string, r: number, g: number, b: number): QuestArt => ({
  key,
  label,
  color,
  tint: `rgba(${r}, ${g}, ${b}, 0.14)`,
  border: `rgba(${r}, ${g}, ${b}, 0.4)`,
  glowShadow: `0 0 0 1px rgba(${r}, ${g}, ${b}, 0.5), 0 0 18px rgba(${r}, ${g}, ${b}, 0.45)`,
})

// A 7-hue categorical set, spread around the wheel so each reads distinct
// at a glance — always paired with an icon + label too, never color alone.
export const QUEST_ART: Record<QuestArtKey, QuestArt> = {
  hydration: art('hydration', 'Hydration', '#22d3ee', 34, 211, 238),
  exercise: art('exercise', 'Exercise', '#fb923c', 251, 146, 60),
  learning: art('learning', 'Learning', '#a78bfa', 167, 139, 250),
  recovery: art('recovery', 'Recovery', '#2dd4bf', 45, 212, 191),
  custom: art('custom', 'Custom', '#f5c518', 245, 197, 24),
  career: art('career', 'Career', '#fb7185', 251, 113, 133),
  discipline: art('discipline', 'Discipline', '#a3e635', 163, 230, 53),
}

const DAILY_QUEST_ART_KEY: Record<string, QuestArtKey> = {
  q_train: 'exercise',
  q_learn: 'learning',
  q_hunt: 'career',
  q_recover: 'recovery',
  q_discipline: 'discipline',
}

export const dailyQuestArt = (questId: string): QuestArt => QUEST_ART[DAILY_QUEST_ART_KEY[questId] ?? 'custom']

export const customQuestArt = (category: QuestCategoryKey): QuestArt => QUEST_ART[category]
