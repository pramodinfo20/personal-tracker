// Skills, Certs and Projects are the same thing three times: a saved list
// of simple records with add / edit / delete. So there is ONE tracker —
// one screen, one sheet, one hook (components/trackers, hooks/useTracker) —
// and each of the three is just a definition here: its fields, and how a
// record is summarised on its card. Adding a fourth simple tracker means
// adding a definition, not another screen.
//
// (Job Search and Goals stay their own screens: each has behaviour the
// plain pattern doesn't — claiming a quest, one-tap mark-done.)

import { formatAppliedDate, isDateKey, localDateKey, normalizeLink } from './jobApplications'

export interface ChoiceOption {
  value: string
  label: string
  /** Pill colour classes (theme-aware tokens) for this choice. */
  pill: string
}

interface FieldBase {
  key: string
  label: string
}

export type FieldDef =
  /** One line of text. `suggestions` offers presets while still allowing anything. */
  | (FieldBase & { kind: 'text'; required?: boolean; maxLength?: number; suggestions?: string[] })
  /** Multi-line, optional. */
  | (FieldBase & { kind: 'notes' })
  /** Optional local date, "YYYY-MM-DD". */
  | (FieldBase & { kind: 'date' })
  /** Optional http(s) link (see normalizeLink). */
  | (FieldBase & { kind: 'link' })
  /** Exactly one of a short list; the first option is the default. */
  | (FieldBase & { kind: 'choice'; options: ChoiceOption[] })

/** A saved record: every field is a string; optional ones are absent when empty. */
export type TrackerItem = { id: string; createdAt: string } & Record<string, string>
/** The form's working copy: every field present, '' when empty. */
export type TrackerDraft = Record<string, string>
export type TrackerProblems = Record<string, string>

/** What a card shows, beyond the title. */
export interface CardView {
  subtitle?: string
  pill?: { label: string; className: string }
  meta?: string
  note?: string
  link?: { href: string; label: string }
}

export interface TrackerDef {
  id: 'skills' | 'certs' | 'projects'
  storageKey: string
  icon: string
  /** Screen title, e.g. "Skills". */
  title: string
  /** e.g. "skill" — used in "Add skill", "No skills yet". */
  singular: string
  plural: string
  /** The first field is the required title shown on the card. */
  fields: FieldDef[]
  /** Checks that span more than one field. */
  check?: (draft: TrackerDraft) => TrackerProblems
  card: (item: TrackerItem, now: Date) => CardView
}

const PILL = {
  neutral: 'border-border-strong bg-backing/50 text-text-secondary',
  blue: 'border-accent/50 bg-accent/15 text-accent-hover',
  gold: 'border-tier-gold/50 bg-tier-gold/15 text-tier-gold',
  purple: 'border-tier-purple/50 bg-tier-purple/15 text-tier-purple',
  green: 'border-success/50 bg-success/15 text-success',
  warning: 'border-warning/50 bg-warning/15 text-warning',
}

const optionFor = (def: TrackerDef, key: string, value: string): ChoiceOption | undefined => {
  const field = def.fields.find((f) => f.key === key)
  return field?.kind === 'choice' ? field.options.find((o) => o.value === value) : undefined
}
const pillFor = (def: TrackerDef, key: string, item: TrackerItem): CardView['pill'] => {
  const option = optionFor(def, key, item[key])
  return option ? { label: option.label, className: option.pill } : undefined
}

// ── The three trackers ──────────────────────────────────────────────────

export const SKILLS: TrackerDef = {
  id: 'skills',
  storageKey: 'p26_skills',
  icon: '🧠',
  title: 'Skills',
  singular: 'skill',
  plural: 'skills',
  fields: [
    { key: 'title', label: 'Skill', kind: 'text', required: true, maxLength: 80 },
    {
      key: 'category',
      label: 'Category',
      kind: 'text',
      maxLength: 40,
      // Presets to pick from; anything else can be typed.
      suggestions: ['Programming', 'Data', 'Cloud & DevOps', 'Languages', 'Tools', 'Soft skills'],
    },
    {
      key: 'level',
      label: 'Proficiency',
      kind: 'choice',
      options: [
        { value: 'beginner', label: 'Beginner', pill: PILL.neutral },
        { value: 'intermediate', label: 'Intermediate', pill: PILL.blue },
        { value: 'advanced', label: 'Advanced', pill: PILL.gold },
        { value: 'expert', label: 'Expert', pill: PILL.purple },
      ],
    },
    { key: 'notes', label: 'Notes', kind: 'notes' },
  ],
  card: (item) => ({ subtitle: item.category, pill: pillFor(SKILLS, 'level', item), note: item.notes }),
}

/** A cert whose expiry date has passed (expiring today is still valid). */
export const isExpired = (item: TrackerItem, now: Date = new Date()): boolean =>
  Boolean(item.expiryDate) && item.expiryDate < localDateKey(now)

export const CERTS: TrackerDef = {
  id: 'certs',
  storageKey: 'p26_certs',
  icon: '📜',
  title: 'Certs',
  singular: 'cert',
  plural: 'certs',
  fields: [
    { key: 'title', label: 'Certification', kind: 'text', required: true, maxLength: 100 },
    { key: 'issuer', label: 'Issuing organization', kind: 'text', maxLength: 80 },
    { key: 'dateEarned', label: 'Date earned', kind: 'date' },
    { key: 'expiryDate', label: 'Expiry date', kind: 'date' },
    { key: 'link', label: 'Credential link', kind: 'link' },
  ],
  check: (d): TrackerProblems =>
    d.dateEarned && d.expiryDate && d.expiryDate < d.dateEarned
      ? { expiryDate: "Expiry can't be before the date earned." }
      : {},
  card: (item, now) => {
    const expired = isExpired(item, now)
    const dates = [
      item.dateEarned && `Earned ${formatAppliedDate(item.dateEarned, now)}`,
      item.expiryDate && `${expired ? 'Expired' : 'Expires'} ${formatAppliedDate(item.expiryDate, now)}`,
    ].filter(Boolean)
    return {
      subtitle: item.issuer,
      pill: expired ? { label: 'Expired', className: PILL.warning } : undefined,
      meta: dates.join(' · ') || undefined,
      link: item.link ? { href: item.link, label: 'View credential' } : undefined,
    }
  },
}

export const PROJECTS: TrackerDef = {
  id: 'projects',
  storageKey: 'p26_projects',
  icon: '🛠️',
  title: 'Projects',
  singular: 'project',
  plural: 'projects',
  fields: [
    { key: 'title', label: 'Project', kind: 'text', required: true, maxLength: 80 },
    { key: 'description', label: 'One-line description', kind: 'text', maxLength: 140 },
    {
      key: 'status',
      label: 'Status',
      kind: 'choice',
      options: [
        { value: 'planning', label: 'Planning', pill: PILL.neutral },
        { value: 'in_progress', label: 'In progress', pill: PILL.blue },
        { value: 'done', label: 'Done', pill: PILL.green },
        { value: 'paused', label: 'Paused', pill: PILL.gold },
      ],
    },
    { key: 'link', label: 'Link', kind: 'link' },
  ],
  card: (item) => ({
    subtitle: item.description,
    pill: pillFor(PROJECTS, 'status', item),
    link: item.link ? { href: item.link, label: 'Open link' } : undefined,
  }),
}

export const TRACKERS: TrackerDef[] = [SKILLS, CERTS, PROJECTS]

// ── Generic draft / validation / ordering ───────────────────────────────

export const emptyTrackerDraft = (def: TrackerDef): TrackerDraft =>
  Object.fromEntries(def.fields.map((f) => [f.key, f.kind === 'choice' ? f.options[0].value : '']))

export const itemToDraft = (def: TrackerDef, item: TrackerItem): TrackerDraft => ({
  ...emptyTrackerDraft(def),
  ...Object.fromEntries(def.fields.filter((f) => item[f.key] !== undefined).map((f) => [f.key, item[f.key]])),
})

const fieldProblem = (field: FieldDef, raw: string): string | null => {
  const value = raw.trim()
  switch (field.kind) {
    case 'text':
      return field.required && !value ? `${field.label} is required.` : null
    case 'notes':
      return null
    case 'date':
      return value === '' || isDateKey(value) ? null : "That isn't a valid date."
    case 'link':
      return normalizeLink(value).ok ? null : "That doesn't look like a web link."
    case 'choice':
      return field.options.some((o) => o.value === value) ? null : `Pick a ${field.label.toLowerCase()}.`
  }
}

export const validateTrackerDraft = (def: TrackerDef, draft: TrackerDraft): TrackerProblems => {
  const problems: TrackerProblems = {}
  for (const field of def.fields) {
    const problem = fieldProblem(field, draft[field.key] ?? '')
    if (problem) problems[field.key] = problem
  }
  return Object.keys(problems).length > 0 ? problems : { ...def.check?.(draft) }
}

// Draft -> stored fields: trimmed, links normalised, empty optionals
// dropped. Call only with a draft that passed validateTrackerDraft.
export const trackerDraftToFields = (def: TrackerDef, draft: TrackerDraft): Record<string, string> => {
  const fields: Record<string, string> = {}
  for (const field of def.fields) {
    const value = (draft[field.key] ?? '').trim()
    if (!value) continue
    if (field.kind === 'link') {
      const link = normalizeLink(value)
      if (link.ok && link.link) fields[field.key] = link.link
    } else {
      fields[field.key] = value
    }
  }
  return fields
}

/** Newest added first. */
export const sortTrackerItems = (list: TrackerItem[]): TrackerItem[] =>
  [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

// ── Validation for backups ──────────────────────────────────────────────

/** Why this isn't a usable saved list for this tracker, or null if it is. */
export const validateTrackerItems = (def: TrackerDef, list: unknown): string | null => {
  if (!Array.isArray(list)) return `invalid ${def.plural}`
  const known = new Set(['id', 'createdAt', ...def.fields.map((f) => f.key)])
  for (const item of list) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return `invalid ${def.singular}`
    const record = item as Record<string, unknown>
    if (typeof record.id !== 'string' || typeof record.createdAt !== 'string') return `invalid ${def.singular}`
    for (const [key, value] of Object.entries(record)) {
      if (!known.has(key) || typeof value !== 'string') return `invalid ${def.singular}`
    }
    // A choice is always stored — a record without one is damaged, not "default".
    if (def.fields.some((f) => f.kind === 'choice' && record[f.key] === undefined)) {
      return `invalid ${def.singular}`
    }
    const draft = itemToDraft(def, record as TrackerItem)
    if (Object.keys(validateTrackerDraft(def, draft)).length > 0) return `invalid ${def.singular}`
    // A stored link must already be in its normalised, http(s) form.
    for (const field of def.fields) {
      if (field.kind !== 'link' || record[field.key] === undefined) continue
      const link = normalizeLink(record[field.key] as string)
      if (!link.ok || link.link !== record[field.key]) return `invalid ${def.singular} link`
    }
  }
  return null
}
