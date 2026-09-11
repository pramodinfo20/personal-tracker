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
}
