// Ported as-is from pramod-2026-tracker.html — the localStorage-backed
// `hunter` state shape (DEFAULT_HUNTER) plus its supporting types.

import type { ActiveGate } from './gates'
import type { StatKey } from './types'

export type { StatKey } from './types'

export interface LogEntry {
  id: number
  date: string
  label: string
  xp: number
  stat: StatKey | 'GATE'
}

export interface StatMeta {
  key: StatKey
  label: string
  icon: string
  color: string
}

export const STAT_META: StatMeta[] = [
  { key: 'STR', label: 'Strength', icon: '💪', color: '#ef4444' },
  { key: 'VIT', label: 'Vitality', icon: '❤️', color: '#22c55e' },
  { key: 'INT', label: 'Intelligence', icon: '🧠', color: '#3b82f6' },
  { key: 'PER', label: 'Perception', icon: '👁️', color: '#8b5cf6' },
  { key: 'AGI', label: 'Agility', icon: '⚡', color: '#f59e0b' },
]

export interface Hunter {
  name: string
  level: number
  xp: number
  statPoints: number
  stats: Record<StatKey, number>
  completedToday: Record<string, boolean>
  lastQuestDate: string
  streak: number
  syncedDate: string | null
  log: LogEntry[]
  unlockedShadows: number[]
  activeGate: ActiveGate | null
  clearedGates: string[]
  logCount: number
  /** Cosmetic-only "focus" chosen during onboarding — which stats get slight visual emphasis. Multi-select: any number of stats, including none (e.g. only "Balanced" picked, or a hunter who predates onboarding). */
  focusStats: StatKey[]
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
  unlockedShadows: [],
  activeGate: null,
  clearedGates: [],
  logCount: 0,
  focusStats: [],
}
