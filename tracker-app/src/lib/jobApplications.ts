// Job Search tracker: the application record, its validation, ordering and
// the small stats shown above the list. Pure data — the saved list lives in
// hooks/useJobApplications.ts, and claiming the Hunter Association quest
// goes through useHunter's claimQuest like every other claim.

import { isDateKey, localDateKey } from './format'
import { DAILY_QUESTS, type ClaimableQuest, type XPTier } from './quests'

export { isDateKey, localDateKey } from './format'

export const JOB_STATUSES = ['applied', 'interview', 'offer', 'rejected'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export interface JobApplication {
  id: string
  company: string
  role: string
  /** Local calendar date, "YYYY-MM-DD" (what a date input gives). */
  dateApplied: string
  status: JobStatus
  notes?: string
  /** Job posting URL — always http(s), see normalizeLink. */
  link?: string
  /** ISO timestamp — breaks ties between applications made on the same day. */
  createdAt: string
}

/** What the add/edit form produces. */
export interface JobApplicationDraft {
  company: string
  role: string
  dateApplied: string
  status: JobStatus
  notes: string
  link: string
}

// A pasted link becomes a safe href or nothing: bare "example.com/job" gets
// https://, and anything that isn't http(s) (javascript:, data:, …) is
// refused rather than stored.
export const normalizeLink = (raw: string): { ok: true; link?: string } | { ok: false } => {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: true }
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false }
    if (!url.hostname.includes('.')) return { ok: false }
    return { ok: true, link: url.href }
  } catch {
    return { ok: false }
  }
}

export type DraftProblems = Partial<Record<'company' | 'dateApplied' | 'link', string>>

export const validateDraft = (draft: JobApplicationDraft): DraftProblems => ({
  ...(draft.company.trim() ? {} : { company: 'Company is required.' }),
  ...(isDateKey(draft.dateApplied) ? {} : { dateApplied: 'Pick the date you applied.' }),
  ...(normalizeLink(draft.link).ok ? {} : { link: "That doesn't look like a web link." }),
})

// Draft -> the fields stored on an application (trimmed, optional fields
// dropped when empty). Call only with a draft that passed validateDraft.
export const draftToFields = (
  draft: JobApplicationDraft,
): Omit<JobApplication, 'id' | 'createdAt'> => {
  const link = normalizeLink(draft.link)
  const notes = draft.notes.trim()
  return {
    company: draft.company.trim(),
    role: draft.role.trim(),
    dateApplied: draft.dateApplied,
    status: draft.status,
    ...(notes ? { notes } : {}),
    ...(link.ok && link.link ? { link: link.link } : {}),
  }
}

export const applicationToDraft = (a: JobApplication): JobApplicationDraft => ({
  company: a.company,
  role: a.role,
  dateApplied: a.dateApplied,
  status: a.status,
  notes: a.notes ?? '',
  link: a.link ?? '',
})

export const emptyDraft = (now: Date = new Date()): JobApplicationDraft => ({
  company: '',
  role: '',
  dateApplied: localDateKey(now),
  status: 'applied',
  notes: '',
  link: '',
})

// Newest first: by date applied, then by when the entry was created.
export const sortApplications = (list: JobApplication[]): JobApplication[] =>
  [...list].sort(
    (a, b) => b.dateApplied.localeCompare(a.dateApplied) || b.createdAt.localeCompare(a.createdAt),
  )

export interface ApplicationStats {
  thisWeek: number
  thisMonth: number
  total: number
}

// "This week" is the calendar week, Monday to Sunday; "this month" the
// calendar month — both by date applied, in local time.
export const applicationStats = (list: JobApplication[], now: Date = new Date()): ApplicationStats => {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  const weekStart = localDateKey(monday)
  const weekEnd = localDateKey(sunday)
  const month = localDateKey(now).slice(0, 7)
  return {
    thisWeek: list.filter((a) => a.dateApplied >= weekStart && a.dateApplied <= weekEnd).length,
    thisMonth: list.filter((a) => a.dateApplied.startsWith(month)).length,
    total: list.length,
  }
}

// "Jan 5" / "Jan 5, 2025" (year only when it isn't this year).
export const formatAppliedDate = (dateKey: string, now: Date = new Date()): string => {
  if (!isDateKey(dateKey)) return dateKey
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(y === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

// ── Hunter Association quest ────────────────────────────────────────────

export const HUNT_QUEST_ID = 'q_hunt'
export const huntQuest = (): ClaimableQuest => DAILY_QUESTS.find((q) => q.id === HUNT_QUEST_ID)!

// The quest's tiers are "1–2 actions", "3–4 actions", "5+ actions". An
// application is one action, so the tier follows how many applications are
// dated today once this one is counted (at least 1 — the one being added).
export const huntTierForActions = (actionsToday: number): XPTier => {
  const tiers = huntQuest().tiers
  const index = actionsToday >= 5 ? 2 : actionsToday >= 3 ? 1 : 0
  return tiers[Math.min(index, tiers.length - 1)]
}

export const applicationsOn = (list: JobApplication[], dateKey: string): number =>
  list.filter((a) => a.dateApplied === dateKey).length

// ── Validation for backups ──────────────────────────────────────────────

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Why this isn't a usable saved list, or null if it is. */
export const validateJobApplications = (list: unknown): string | null => {
  if (!Array.isArray(list)) return 'invalid job applications'
  for (const a of list) {
    if (!isObject(a) || typeof a.id !== 'string' || typeof a.company !== 'string' || !a.company.trim()) {
      return 'invalid job application'
    }
    if (typeof a.role !== 'string' || !isDateKey(a.dateApplied) || typeof a.createdAt !== 'string') {
      return 'invalid job application'
    }
    if (!(JOB_STATUSES as readonly unknown[]).includes(a.status)) return 'invalid job application status'
    if (a.notes !== undefined && typeof a.notes !== 'string') return 'invalid job application'
    if (a.link !== undefined) {
      const link = typeof a.link === 'string' ? normalizeLink(a.link) : { ok: false as const }
      if (!link.ok || link.link !== a.link) return 'invalid job application link'
    }
  }
  return null
}
