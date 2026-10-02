// The curated activity library — the only source of XP for anything a user
// adds (a recurring custom quest) or logs (a one-off Log Activity). Every
// activity carries a FIXED tier list; nothing in the app lets a user type an
// XP value. useCustomQuests.addQuest and useHunter.logActivity both take an
// activity id and look the tiers up here, so even a hand-crafted call can't
// introduce an XP value that isn't in this file.

import type { XPTier } from './quests'
import type { StatKey } from './types'

// Also the category keys stored on CustomQuest.category — the first five
// predate the library (saved custom quests may use any of them), so they
// must keep their meaning; 'career' is new.
export type ActivityCategoryKey =
  | 'exercise'
  | 'learning'
  | 'hydration'
  | 'recovery'
  | 'career'
  | 'custom'

/** Two CSS colors for a 135° linear-gradient — the card's "background image". */
export type Gradient = readonly [string, string]

export interface ActivityCategory {
  key: ActivityCategoryKey
  label: string
  icon: string
  gradient: Gradient
}

export interface Activity {
  id: string
  name: string
  category: ActivityCategoryKey
  /** Key into QUEST_ICONS (customQuests.ts) — what a saved quest stores. */
  iconKey: string
  statKey: StatKey
  gradient: Gradient
  /** Ascending by xp. Copied verbatim onto a saved custom quest. */
  tiers: XPTier[]
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { key: 'exercise', label: 'Exercise', icon: '🏋️', gradient: ['#f97316', '#be123c'] },
  { key: 'learning', label: 'Reading / Learning', icon: '📚', gradient: ['#3b82f6', '#4338ca'] },
  { key: 'hydration', label: 'Hydration', icon: '💧', gradient: ['#06b6d4', '#2563eb'] },
  { key: 'recovery', label: 'Mindfulness / Recovery', icon: '🧘', gradient: ['#8b5cf6', '#be185d'] },
  { key: 'career', label: 'Career / Networking', icon: '💼', gradient: ['#10b981', '#0f766e'] },
  { key: 'custom', label: 'Other', icon: '⭐', gradient: ['#64748b', '#334155'] },
]

export const ACTIVITY_LIBRARY: Activity[] = [
  // ── Exercise ──
  {
    id: 'running',
    name: 'Running',
    category: 'exercise',
    iconKey: 'run',
    statKey: 'STR',
    gradient: ['#fb923c', '#dc2626'],
    tiers: [
      { label: 'General 30 min', xp: 20 },
      { label: '5K', xp: 25 },
      { label: '10K', xp: 45 },
    ],
  },
  {
    id: 'cycling',
    name: 'Cycling',
    category: 'exercise',
    iconKey: 'bike',
    statKey: 'STR',
    gradient: ['#facc15', '#ea580c'],
    tiers: [
      { label: '30 min', xp: 20 },
      { label: '60 min', xp: 35 },
      { label: '90+ min', xp: 50 },
    ],
  },
  {
    id: 'gym',
    name: 'Gym / Weights',
    category: 'exercise',
    iconKey: 'dumbbell',
    statKey: 'STR',
    gradient: ['#f43f5e', '#7f1d1d'],
    tiers: [
      { label: '30 min', xp: 20 },
      { label: '45 min', xp: 30 },
      { label: '60+ min', xp: 45 },
    ],
  },
  {
    id: 'yoga',
    name: 'Yoga',
    category: 'exercise',
    iconKey: 'yoga',
    statKey: 'AGI',
    gradient: ['#f472b6', '#9333ea'],
    tiers: [
      { label: '15 min', xp: 12 },
      { label: '30 min', xp: 20 },
      { label: '60 min', xp: 35 },
    ],
  },
  {
    id: 'walking',
    name: 'Walking',
    category: 'exercise',
    iconKey: 'walk',
    statKey: 'VIT',
    gradient: ['#a3e635', '#15803d'],
    tiers: [
      { label: '5k steps', xp: 10 },
      { label: '10k steps', xp: 20 },
      { label: '15k+ steps', xp: 30 },
    ],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'exercise',
    iconKey: 'swim',
    statKey: 'STR',
    gradient: ['#22d3ee', '#1d4ed8'],
    tiers: [
      { label: '15 min', xp: 15 },
      { label: '30 min', xp: 25 },
      { label: '45 min', xp: 35 },
      { label: '60+ min', xp: 50 },
    ],
  },

  // ── Reading / Learning ──
  {
    id: 'reading',
    name: 'Reading',
    category: 'learning',
    iconKey: 'book',
    statKey: 'INT',
    gradient: ['#fbbf24', '#b45309'],
    tiers: [
      { label: '15 min', xp: 10 },
      { label: '30 min', xp: 20 },
      { label: '60+ min', xp: 35 },
    ],
  },
  {
    id: 'studying',
    name: 'Studying',
    category: 'learning',
    iconKey: 'brain',
    statKey: 'INT',
    gradient: ['#60a5fa', '#4338ca'],
    tiers: [
      { label: '30 min', xp: 20 },
      { label: '60 min', xp: 35 },
      { label: '2+ hours', xp: 60 },
    ],
  },
  {
    id: 'coding',
    name: 'Coding Practice',
    category: 'learning',
    iconKey: 'code',
    statKey: 'INT',
    gradient: ['#34d399', '#1e3a8a'],
    tiers: [
      { label: '30 min', xp: 20 },
      { label: '60 min', xp: 35 },
      { label: '2+ hours', xp: 60 },
    ],
  },
  {
    id: 'language',
    name: 'Language Practice',
    category: 'learning',
    iconKey: 'speech',
    statKey: 'INT',
    gradient: ['#c084fc', '#1d4ed8'],
    tiers: [
      { label: '15 min', xp: 10 },
      { label: '30 min', xp: 20 },
      { label: '60+ min', xp: 35 },
    ],
  },

  // ── Hydration ──
  {
    id: 'water',
    name: 'Drinking Water',
    category: 'hydration',
    iconKey: 'droplet',
    statKey: 'VIT',
    gradient: ['#67e8f9', '#0369a1'],
    tiers: [
      { label: '0.5L', xp: 8 },
      { label: '1L', xp: 15 },
      { label: '2L', xp: 25 },
    ],
  },

  // ── Mindfulness / Recovery ──
  {
    id: 'meditation',
    name: 'Meditation',
    category: 'recovery',
    iconKey: 'meditate',
    statKey: 'VIT',
    gradient: ['#a78bfa', '#5b21b6'],
    tiers: [
      { label: '5 min', xp: 5 },
      { label: '10 min', xp: 10 },
      { label: '20+ min', xp: 20 },
    ],
  },
  {
    id: 'journaling',
    name: 'Journaling',
    category: 'recovery',
    iconKey: 'pen',
    statKey: 'VIT',
    gradient: ['#fda4af', '#a21caf'],
    tiers: [
      { label: '5 min', xp: 5 },
      { label: '15 min', xp: 12 },
      { label: '30 min', xp: 20 },
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep on Time',
    category: 'recovery',
    iconKey: 'moon',
    statKey: 'VIT',
    gradient: ['#6366f1', '#0f172a'],
    tiers: [
      { label: 'On time', xp: 15 },
      { label: 'Early', xp: 25 },
    ],
  },

  // ── Career / Networking ──
  {
    id: 'job_apps',
    name: 'Job Applications',
    category: 'career',
    iconKey: 'briefcase',
    statKey: 'PER',
    gradient: ['#2dd4bf', '#0f766e'],
    tiers: [
      { label: '1 application', xp: 10 },
      { label: '3 applications', xp: 25 },
      { label: '5+ applications', xp: 40 },
    ],
  },
  {
    id: 'networking',
    name: 'Networking',
    category: 'career',
    iconKey: 'handshake',
    statKey: 'PER',
    gradient: ['#4ade80', '#0e7490'],
    tiers: [
      { label: '1 contact', xp: 10 },
      { label: '3 contacts', xp: 20 },
      { label: 'Event / call', xp: 30 },
    ],
  },
  {
    id: 'interview_prep',
    name: 'Interview Prep',
    category: 'career',
    iconKey: 'target',
    statKey: 'PER',
    gradient: ['#fcd34d', '#047857'],
    tiers: [
      { label: '30 min', xp: 20 },
      { label: '60+ min', xp: 35 },
    ],
  },

  // ── Other ── the one catch-all; still fixed tiers, never a free XP field.
  {
    id: 'general',
    name: 'General Task',
    category: 'custom',
    iconKey: 'star',
    statKey: 'AGI',
    gradient: ['#94a3b8', '#334155'],
    tiers: [
      { label: 'Light', xp: 10 },
      { label: 'Medium', xp: 20 },
      { label: 'Long', xp: 35 },
    ],
  },
]

export const activityCategory = (key: ActivityCategoryKey): ActivityCategory =>
  ACTIVITY_CATEGORIES.find((c) => c.key === key) ??
  ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1]

export const activitiesIn = (key: ActivityCategoryKey): Activity[] =>
  ACTIVITY_LIBRARY.filter((a) => a.category === key)

export const findActivity = (id: string): Activity | undefined =>
  ACTIVITY_LIBRARY.find((a) => a.id === id)

export const gradientCss = ([from, to]: Gradient): string =>
  `linear-gradient(135deg, ${from}, ${to})`
