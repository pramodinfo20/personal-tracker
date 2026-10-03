// Backup / restore of everything the app persists. The save is spread over
// three localStorage keys (see BACKUP_KEYS); a backup is one JSON file
// holding all of them, so a restore puts the app back exactly as it was.
//
// Restoring is all-or-nothing: the file is fully validated before anything
// is written, and if a write fails part-way the keys already written are
// rolled back — a bad file or a full disk can't leave a half-restored save.

import type { CustomQuest } from './customQuests'
import type { Hunter } from './hunterState'
import { isThemePreference, type ThemePreference } from './theme'

export const BACKUP_APP = 'pramod-tracker'
export const BACKUP_VERSION = 1

// Every key the app saves under. A new persisted key must be added here to
// be backed up (backup.test.ts fails if useSaved is used with a key that
// isn't listed).
export const BACKUP_KEYS = {
  hunter: 'p26_hunter',
  customQuests: 'p26_custom_quests',
  theme: 'p26_theme',
} as const

export interface BackupData {
  hunter: Hunter
  customQuests: CustomQuest[]
  /** Absent in the file = the user never chose one; restored as "follow the system". */
  theme?: ThemePreference
}

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: BackupData
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const readJson = (store: Store, key: string): unknown => {
  const raw = store.getItem(key)
  if (raw === null) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

// Snapshot of what's saved right now. Reads storage (not React state), so
// it's exactly what a reload would load. Returns null when there's no
// hunter save to back up.
export const buildBackup = (store: Store, now: Date = new Date()): Backup | null => {
  const hunter = readJson(store, BACKUP_KEYS.hunter)
  if (validateHunter(hunter) !== null) return null
  const customQuests = readJson(store, BACKUP_KEYS.customQuests)
  const theme = readJson(store, BACKUP_KEYS.theme)
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: {
      hunter: hunter as Hunter,
      customQuests: validateCustomQuests(customQuests) === null ? (customQuests as CustomQuest[]) : [],
      ...(isThemePreference(theme) ? { theme } : {}),
    },
  }
}

// "tracker-backup-pramod-2026-10-03.json" — name made filesystem-safe.
export const backupFilename = (hunterName: string, date: Date = new Date()): string => {
  const safe =
    hunterName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'hunter'
  return `tracker-backup-${safe}-${date.toISOString().slice(0, 10)}.json`
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const STATS = ['STR', 'VIT', 'INT', 'PER', 'AGI'] as const

// Returns why this isn't a usable hunter save, or null if it is. Checks the
// fields the app can't run without; newer optional fields (hiddenQuestIds,
// goals, dailyStatXP, age…) may be absent — older backups stay restorable.
export const validateHunter = (h: unknown): string | null => {
  if (!isObject(h)) return 'no hunter data'
  if (typeof h.name !== 'string' || !h.name.trim()) return 'hunter has no name'
  if (!isCount(h.level) || h.level < 1) return 'invalid level'
  if (!isCount(h.xp)) return 'invalid XP'
  if (!isObject(h.stats) || !STATS.every((s) => isCount((h.stats as Record<string, unknown>)[s]))) {
    return 'invalid stats'
  }
  if (!isObject(h.completedToday)) return 'invalid quest state'
  if (typeof h.lastQuestDate !== 'string') return 'invalid quest date'
  if (!Array.isArray(h.log)) return 'invalid activity log'
  for (const e of h.log) {
    if (!isObject(e) || typeof e.date !== 'string' || typeof e.label !== 'string' || !isCount(e.xp)) {
      return 'invalid activity log entry'
    }
  }
  if (h.dailyXP !== undefined && !isObject(h.dailyXP)) return 'invalid XP history'
  if (h.hiddenQuestIds !== undefined && !Array.isArray(h.hiddenQuestIds)) return 'invalid hidden quests'
  return null
}

export const validateCustomQuests = (q: unknown): string | null => {
  if (!Array.isArray(q)) return 'invalid custom quests'
  for (const c of q) {
    if (!isObject(c) || typeof c.id !== 'string' || typeof c.name !== 'string') {
      return 'invalid custom quest'
    }
    if (typeof c.active !== 'boolean' || !Array.isArray(c.tiers)) return 'invalid custom quest'
    for (const t of c.tiers) {
      if (!isObject(t) || typeof t.label !== 'string' || !isCount(t.xp)) return 'invalid custom quest tier'
    }
  }
  return null
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; reason: string }

// Turns file text into a validated Backup, or says why not. Never throws.
export const parseBackup = (text: string): ParseResult => {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: "That file isn't valid JSON — it doesn't look like a backup." }
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP) {
    return { ok: false, reason: "That file isn't a backup from this app." }
  }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    return {
      ok: false,
      reason: 'That backup was made by a newer version of the app. Update the app, then restore.',
    }
  }
  if (!isObject(raw.data)) return { ok: false, reason: 'That backup is incomplete (no data).' }
  const hunterProblem = validateHunter(raw.data.hunter)
  if (hunterProblem) return { ok: false, reason: `That backup is damaged (${hunterProblem}).` }
  const questsProblem = validateCustomQuests(raw.data.customQuests ?? [])
  if (questsProblem) return { ok: false, reason: `That backup is damaged (${questsProblem}).` }
  if (raw.data.theme !== undefined && !isThemePreference(raw.data.theme)) {
    return { ok: false, reason: 'That backup is damaged (invalid theme).' }
  }
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: raw.version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      data: {
        hunter: raw.data.hunter as Hunter,
        customQuests: (raw.data.customQuests ?? []) as CustomQuest[],
        ...(raw.data.theme !== undefined ? { theme: raw.data.theme as ThemePreference } : {}),
      },
    },
  }
}

export type ApplyResult = { ok: true } | { ok: false; reason: string }

// Writes a validated backup over the current save. If any write fails, every
// key is put back exactly as it was before (including "was absent").
export const applyBackup = (backup: Backup, store: Store): ApplyResult => {
  const keys = Object.values(BACKUP_KEYS)
  const before = new Map(keys.map((k) => [k, store.getItem(k)]))
  try {
    store.setItem(BACKUP_KEYS.hunter, JSON.stringify(backup.data.hunter))
    store.setItem(BACKUP_KEYS.customQuests, JSON.stringify(backup.data.customQuests))
    if (backup.data.theme !== undefined) {
      store.setItem(BACKUP_KEYS.theme, JSON.stringify(backup.data.theme))
    } else {
      store.removeItem(BACKUP_KEYS.theme)
    }
    return { ok: true }
  } catch {
    for (const [key, value] of before) {
      try {
        if (value === null) store.removeItem(key)
        else store.setItem(key, value)
      } catch {
        // Best effort: storage is failing; nothing more we can do for this key.
      }
    }
    return { ok: false, reason: "Couldn't write to this browser's storage — nothing was changed." }
  }
}

/** One-line description of a save, for the "replace X with Y?" confirmation. */
export const describeHunter = (h: Hunter): string => `${h.name} · Level ${h.level} · ${h.xp} XP`
