// Backup / restore of everything the app persists. The save is spread over
// three localStorage keys (see BACKUP_KEYS); a backup is one JSON file
// holding all of them, so a restore puts the app back exactly as it was.
//
// Restoring is all-or-nothing: the file is fully validated before anything
// is written, and if a write fails part-way the keys already written are
// rolled back — a bad file or a full disk can't leave a half-restored save.

import { isAvatarDataUrl } from './avatar'
import { COMPANION_MILESTONES, COMPANIONS } from './companions'
import type { CustomQuest } from './customQuests'
import { isDateKey, localDateKey } from './format'
import { GATE_TEMPLATES } from './gates'
import { validateGoals, type Goal } from './goals'
import type { Hunter } from './hunterState'
import { ACTIVITY_CATEGORIES } from './activities'
import { validateJobApplications, type JobApplication } from './jobApplications'
import { isThemePreference, type ThemePreference } from './theme'
import { TRACKERS, validateTrackerItems, type TrackerItem } from './trackers'

export const BACKUP_APP = 'pramod-tracker'
export const BACKUP_VERSION = 1

// Every key the app saves under. A new persisted key must be added here to
// be backed up (backup.test.ts fails if useSaved is used with a key that
// isn't listed).
export const BACKUP_KEYS = {
  hunter: 'p26_hunter',
  customQuests: 'p26_custom_quests',
  theme: 'p26_theme',
  jobApplications: 'p26_job_applications',
  trackedGoals: 'p26_goals',
  skills: 'p26_skills',
  certs: 'p26_certs',
  projects: 'p26_projects',
} as const

export interface BackupData {
  hunter: Hunter
  customQuests: CustomQuest[]
  /** Absent in the file = the user never chose one; restored as "follow the system". */
  theme?: ThemePreference
  /** Absent in backups from before the Job Search tracker (and when none were ever saved). */
  jobApplications?: JobApplication[]
  /**
   * The Goals tracker's list (not to be confused with hunter.goals, the
   * categories picked in setup). Absent in older backups.
   */
  trackedGoals?: Goal[]
  /** The simple trackers' lists (lib/trackers.ts). Each absent in older backups. */
  skills?: TrackerItem[]
  certs?: TrackerItem[]
  projects?: TrackerItem[]
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
  const jobs = readJson(store, BACKUP_KEYS.jobApplications)
  const goals = readJson(store, BACKUP_KEYS.trackedGoals)
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: {
      hunter: hunter as Hunter,
      customQuests: validateCustomQuests(customQuests) === null ? (customQuests as CustomQuest[]) : [],
      ...(isThemePreference(theme) ? { theme } : {}),
      ...(validateJobApplications(jobs) === null ? { jobApplications: jobs as JobApplication[] } : {}),
      ...(validateGoals(goals) === null ? { trackedGoals: goals as Goal[] } : {}),
      ...Object.fromEntries(
        TRACKERS.map((t) => [t.id, readJson(store, BACKUP_KEYS[t.id])] as const).filter(
          ([id, list]) => validateTrackerItems(TRACKERS.find((t) => t.id === id)!, list) === null,
        ),
      ),
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
  return `tracker-backup-${safe}-${localDateKey(date)}.json`
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const STATS = ['STR', 'VIT', 'INT', 'PER', 'AGI'] as const
const STAT_BUCKETS = [...STATS, 'GATE'] as const
const companionIds = new Set(COMPANIONS.map((c) => c.id))
const gateIds = new Set(GATE_TEMPLATES.map((g) => g.id))
const milestoneSet = new Set<number>(COMPANION_MILESTONES)
const goalKeys = new Set<string>(ACTIVITY_CATEGORIES.map((c) => c.key))

const isIntegerCount = (v: unknown): v is number => isCount(v) && Number.isInteger(v)
const isStat = (v: unknown): boolean => (STATS as readonly unknown[]).includes(v)
const isStatBucket = (v: unknown): boolean => (STAT_BUCKETS as readonly unknown[]).includes(v)

const validateBooleanRecord = (v: unknown, label: string): string | null => {
  if (!isObject(v)) return `invalid ${label}`
  return Object.values(v).every((value) => typeof value === 'boolean') ? null : `invalid ${label}`
}

const validateCountRecord = (v: unknown, label: string): string | null => {
  if (!isObject(v)) return `invalid ${label}`
  for (const [key, value] of Object.entries(v)) {
    if (!isDateKey(key) || !isCount(value)) return `invalid ${label}`
  }
  return null
}

const validateDailyStatXP = (v: unknown): string | null => {
  if (!isObject(v)) return 'invalid stat history'
  for (const [date, day] of Object.entries(v)) {
    if (!isDateKey(date) || !isObject(day)) return 'invalid stat history'
    for (const [bucket, amount] of Object.entries(day)) {
      if (!isStatBucket(bucket) || !isCount(amount)) return 'invalid stat history'
    }
  }
  return null
}

const validateStringArray = (v: unknown, label: string): string | null =>
  Array.isArray(v) && v.every((item) => typeof item === 'string') ? null : `invalid ${label}`

const validateActiveGate = (v: unknown): string | null => {
  if (v === null) return null
  if (!isObject(v)) return 'invalid active gate'
  const template = GATE_TEMPLATES.find((g) => g.id === v.templateId)
  if (!template) return 'invalid active gate'
  if (v.tier !== template.tier || v.name !== template.name) return 'invalid active gate'
  if (!isCount(v.startedAt) || !isCount(v.expiresAt) || v.expiresAt < v.startedAt) {
    return 'invalid active gate'
  }
  if (!isObject(v.completedTasks)) return 'invalid active gate'
  const taskIds = new Set(template.tasks.map((t) => t.id))
  for (const [taskId, done] of Object.entries(v.completedTasks)) {
    if (!taskIds.has(taskId) || typeof done !== 'boolean') return 'invalid active gate'
  }
  return null
}

// Returns why this isn't a usable hunter save, or null if it is. Checks the
// fields the app can't run without; newer optional fields (hiddenQuestIds,
// goals, dailyStatXP, age…) may be absent — older backups stay restorable.
export const validateHunter = (h: unknown): string | null => {
  if (!isObject(h)) return 'no hunter data'
  if (typeof h.name !== 'string' || !h.name.trim()) return 'hunter has no name'
  if (!isCount(h.level) || h.level < 1) return 'invalid level'
  if (!isCount(h.xp)) return 'invalid XP'
  if (!isIntegerCount(h.statPoints)) return 'invalid stat points'
  if (!isObject(h.stats) || !STATS.every((s) => isCount((h.stats as Record<string, unknown>)[s]))) {
    return 'invalid stats'
  }
  const completedProblem = validateBooleanRecord(h.completedToday, 'quest state')
  if (completedProblem) return completedProblem
  if (!isDateKey(h.lastQuestDate)) return 'invalid quest date'
  if (h.streak !== undefined && !isIntegerCount(h.streak)) return 'invalid streak'
  if (!Array.isArray(h.log)) return 'invalid activity log'
  for (const e of h.log) {
    if (
      !isObject(e) ||
      typeof e.date !== 'string' ||
      Number.isNaN(new Date(e.date).getTime()) ||
      typeof e.label !== 'string' ||
      !isCount(e.xp) ||
      !isStatBucket(e.stat)
    ) {
      return 'invalid activity log entry'
    }
    if (e.questId !== undefined && typeof e.questId !== 'string') return 'invalid activity log entry'
    if (e.tier !== undefined && typeof e.tier !== 'string') return 'invalid activity log entry'
    if (e.category !== undefined && typeof e.category !== 'string') return 'invalid activity log entry'
  }
  if (h.dailyXP !== undefined) {
    const problem = validateCountRecord(h.dailyXP, 'XP history')
    if (problem) return problem
  }
  if (h.dailyStatXP !== undefined) {
    const problem = validateDailyStatXP(h.dailyStatXP)
    if (problem) return problem
  }
  if (h.hiddenQuestIds !== undefined) {
    const problem = validateStringArray(h.hiddenQuestIds, 'hidden quests')
    if (problem) return problem
  }
  if (h.photo !== undefined && !isAvatarDataUrl(h.photo)) return 'invalid profile photo'
  if (
    h.recruitedCompanions !== undefined &&
    !(
      Array.isArray(h.recruitedCompanions) &&
      h.recruitedCompanions.every((c) => typeof c === 'string' && companionIds.has(c))
    )
  ) {
    return 'invalid companions'
  }
  if (
    h.unlockedShadows !== undefined &&
    !(
      Array.isArray(h.unlockedShadows) &&
      h.unlockedShadows.every((m) => Number.isInteger(m) && milestoneSet.has(m))
    )
  ) {
    return 'invalid companion milestones'
  }
  for (const key of ['tickets', 'claimCount', 'claimTicketsAwarded'] as const) {
    if (h[key] !== undefined && !isIntegerCount(h[key])) return 'invalid ticket count'
  }
  if (h.lastStreakTicketDate !== undefined && !isDateKey(h.lastStreakTicketDate)) {
    return 'invalid ticket count'
  }
  if (h.activeGate !== undefined) {
    const gateProblem = validateActiveGate(h.activeGate)
    if (gateProblem) return gateProblem
  }
  if (
    h.clearedGates !== undefined &&
    !(Array.isArray(h.clearedGates) && h.clearedGates.every((g) => typeof g === 'string' && gateIds.has(g)))
  ) {
    return 'invalid cleared gates'
  }
  if (h.logCount !== undefined && !isIntegerCount(h.logCount)) return 'invalid log count'
  if (h.focusStats !== undefined && !(Array.isArray(h.focusStats) && h.focusStats.every(isStat))) {
    return 'invalid focus stats'
  }
  if (h.goals !== undefined && !(Array.isArray(h.goals) && h.goals.every((g) => typeof g === 'string' && goalKeys.has(g)))) {
    return 'invalid onboarding goals'
  }
  for (const key of ['age', 'heightCm', 'weightKg'] as const) {
    if (h[key] !== undefined && !isCount(h[key])) return 'invalid profile details'
  }
  if (h.joinedAt !== undefined && (typeof h.joinedAt !== 'string' || Number.isNaN(new Date(h.joinedAt).getTime()))) {
    return 'invalid joined date'
  }
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
  const data = raw.data
  const hunterProblem = validateHunter(raw.data.hunter)
  if (hunterProblem) return { ok: false, reason: `That backup is damaged (${hunterProblem}).` }
  const questsProblem = validateCustomQuests(raw.data.customQuests ?? [])
  if (questsProblem) return { ok: false, reason: `That backup is damaged (${questsProblem}).` }
  if (raw.data.theme !== undefined && !isThemePreference(raw.data.theme)) {
    return { ok: false, reason: 'That backup is damaged (invalid theme).' }
  }
  if (raw.data.jobApplications !== undefined) {
    const jobsProblem = validateJobApplications(raw.data.jobApplications)
    if (jobsProblem) return { ok: false, reason: `That backup is damaged (${jobsProblem}).` }
  }
  if (raw.data.trackedGoals !== undefined) {
    const goalsProblem = validateGoals(raw.data.trackedGoals)
    if (goalsProblem) return { ok: false, reason: `That backup is damaged (${goalsProblem}).` }
  }
  for (const t of TRACKERS) {
    if (raw.data[t.id] === undefined) continue
    const problem = validateTrackerItems(t, raw.data[t.id])
    if (problem) return { ok: false, reason: `That backup is damaged (${problem}).` }
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
        ...(raw.data.jobApplications !== undefined
          ? { jobApplications: raw.data.jobApplications as JobApplication[] }
          : {}),
        ...(raw.data.trackedGoals !== undefined ? { trackedGoals: raw.data.trackedGoals as Goal[] } : {}),
        ...Object.fromEntries(
          TRACKERS.filter((t) => data[t.id] !== undefined).map((t) => [t.id, data[t.id] as TrackerItem[]]),
        ),
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
    if (backup.data.jobApplications !== undefined) {
      store.setItem(BACKUP_KEYS.jobApplications, JSON.stringify(backup.data.jobApplications))
    } else {
      store.removeItem(BACKUP_KEYS.jobApplications)
    }
    if (backup.data.trackedGoals !== undefined) {
      store.setItem(BACKUP_KEYS.trackedGoals, JSON.stringify(backup.data.trackedGoals))
    } else {
      store.removeItem(BACKUP_KEYS.trackedGoals)
    }
    for (const t of TRACKERS) {
      const list = backup.data[t.id]
      if (list !== undefined) store.setItem(BACKUP_KEYS[t.id], JSON.stringify(list))
      else store.removeItem(BACKUP_KEYS[t.id])
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
