import { describe, expect, it } from 'vitest'
import {
  BACKUP_APP,
  BACKUP_KEYS,
  BACKUP_VERSION,
  applyBackup,
  backupFilename,
  buildBackup,
  parseBackup,
  validateHunter,
  type Backup,
} from './backup'
import type { CustomQuest } from './customQuests'
import type { Goal } from './goals'
import type { TrackerItem } from './trackers'
import { DEFAULT_HUNTER, type Hunter } from './hunterState'
import type { JobApplication } from './jobApplications'

// A minimal in-memory Storage; `failOnSet` makes the Nth setItem throw, to
// simulate storage failing part-way through a restore.
const memoryStore = (initial: Record<string, string> = {}, failOnSet?: number) => {
  const data = new Map(Object.entries(initial))
  let sets = 0
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      sets += 1
      if (failOnSet !== undefined && sets === failOnSet) throw new Error('QuotaExceededError')
      data.set(k, v)
    },
    removeItem: (k: string) => void data.delete(k),
    snapshot: () => Object.fromEntries(data),
  }
}

// Stands in for a resized profile photo (a small JPEG data URL).
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJ=='

// A full, realistic save: every kind of state the app persists.
const HUNTER: Hunter = {
  ...DEFAULT_HUNTER,
  name: 'Pramod',
  level: 11,
  xp: 640,
  statPoints: 30,
  stats: { STR: 16, VIT: 13, INT: 15, PER: 12, AGI: 11 },
  completedToday: { q_learn: true, cq_w: true },
  lastQuestDate: '2026-10-03',
  streak: 6,
  log: [
    { id: 3, date: '2026-10-03T09:00:00.000Z', label: 'Skill Grinding', xp: 25, stat: 'INT', questId: 'q_learn', tier: '30 min' },
    { id: 2, date: '2026-10-03T08:00:00.000Z', label: 'Running: Riverside', xp: 45, stat: 'STR', tier: '10K', category: 'exercise' },
    { id: 1, date: '2026-10-01T08:00:00.000Z', label: 'Gate cleared: E-Rank Gate', xp: 120, stat: 'GATE' },
  ],
  dailyXP: { '2026-10-03': 70, '2026-10-01': 120, '2026-09-20': 95 },
  dailyStatXP: { '2026-10-03': { INT: 25, STR: 45 }, '2026-10-01': { GATE: 120 } },
  unlockedShadows: [5, 10],
  echoShards: 7,
  clearedGates: ['gate_e'],
  logCount: 1,
  focusStats: ['STR', 'INT'],
  hiddenQuestIds: ['q_hunt', 'q_discipline'],
  goals: ['exercise', 'learning'],
  age: 30,
  heightCm: 178,
  weightKg: 74,
  joinedAt: '2026-09-01T00:00:00.000Z',
  photo: PHOTO,
}
const QUESTS: CustomQuest[] = [
  { id: 'cq_w', name: 'Drinking Water', category: 'hydration', iconKey: 'droplet', statKey: 'VIT', tiers: [{ label: '1L', xp: 15 }, { label: '2L', xp: 25 }], active: true, activityId: 'water' },
  { id: 'cq_old', name: 'Morning Stretch', category: 'custom', iconKey: 'star', statKey: 'AGI', tiers: [{ label: 'Quick', xp: 7 }], active: false },
]
const JOBS: JobApplication[] = [
  { id: 'job_1', company: 'Siemens', role: 'Data Engineer', dateApplied: '2026-10-02', status: 'interview', notes: 'Referral from Anna', link: 'https://jobs.siemens.com/123', createdAt: '2026-10-02T09:00:00.000Z' },
  { id: 'job_2', company: 'Bosch', role: '', dateApplied: '2026-09-20', status: 'rejected', createdAt: '2026-09-20T09:00:00.000Z' },
]
const GOALS: Goal[] = [
  { id: 'goal_1', title: 'Reach B2 German', category: 'learning', targetDate: '2026-12-31', status: 'in_progress', createdAt: '2026-10-01T09:00:00.000Z' },
  { id: 'goal_2', title: 'Run 10K', category: 'exercise', status: 'done', createdAt: '2026-09-01T09:00:00.000Z' },
]
const SKILL_ITEMS = [
  { id: 'skills_1', createdAt: '2026-10-01T09:00:00.000Z', title: 'SQL', category: 'Data', level: 'advanced', notes: 'Window functions' },
] as TrackerItem[]
const CERT_ITEMS = [
  { id: 'certs_1', createdAt: '2026-10-01T09:00:00.000Z', title: 'AWS Cloud Practitioner', issuer: 'Amazon', dateEarned: '2025-03-01', expiryDate: '2028-03-01', link: 'https://aws.amazon.com/verify/abc' },
] as TrackerItem[]
const PROJECT_ITEMS = [
  { id: 'projects_1', createdAt: '2026-10-01T09:00:00.000Z', title: 'Tracker app', description: 'Real-life progression PWA', status: 'in_progress' },
] as TrackerItem[]
const SAVED = {
  [BACKUP_KEYS.hunter]: JSON.stringify(HUNTER),
  [BACKUP_KEYS.customQuests]: JSON.stringify(QUESTS),
  [BACKUP_KEYS.theme]: JSON.stringify('light'),
  [BACKUP_KEYS.jobApplications]: JSON.stringify(JOBS),
  [BACKUP_KEYS.trackedGoals]: JSON.stringify(GOALS),
  [BACKUP_KEYS.skills]: JSON.stringify(SKILL_ITEMS),
  [BACKUP_KEYS.certs]: JSON.stringify(CERT_ITEMS),
  [BACKUP_KEYS.projects]: JSON.stringify(PROJECT_ITEMS),
}
const NOW = new Date('2026-10-03T12:00:00.000Z')

describe('buildBackup', () => {
  it('captures every saved key in one object, stamped with app, version and time', () => {
    const backup = buildBackup(memoryStore(SAVED), NOW)!
    expect(backup).toEqual({
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: '2026-10-03T12:00:00.000Z',
      data: { hunter: HUNTER, customQuests: QUESTS, theme: 'light', jobApplications: JOBS, trackedGoals: GOALS, skills: SKILL_ITEMS, certs: CERT_ITEMS, projects: PROJECT_ITEMS },
    })
  })

  it('is null when there is no hunter save to back up', () => {
    expect(buildBackup(memoryStore())).toBeNull()
    expect(buildBackup(memoryStore({ [BACKUP_KEYS.hunter]: '{not json' }))).toBeNull()
  })

  it('backs up a hunter with no custom quests or theme choice yet', () => {
    const backup = buildBackup(memoryStore({ [BACKUP_KEYS.hunter]: JSON.stringify(HUNTER) }), NOW)!
    expect(backup.data.customQuests).toEqual([])
    expect('theme' in backup.data).toBe(false)
  })
})

describe('export -> restore round trip', () => {
  it('restoring an exported file onto an empty browser reproduces the save exactly', () => {
    const source = memoryStore(SAVED)
    const file = JSON.stringify(buildBackup(source, NOW), null, 2)

    const target = memoryStore() // "new phone"
    const parsed = parseBackup(file)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(applyBackup(parsed.backup, target)).toEqual({ ok: true })

    // Byte-for-byte the same values under the same keys...
    expect(target.snapshot()).toEqual(source.snapshot())
    // ...and structurally identical state.
    expect(JSON.parse(target.getItem(BACKUP_KEYS.hunter)!)).toEqual(HUNTER)
    expect(JSON.parse(target.getItem(BACKUP_KEYS.customQuests)!)).toEqual(QUESTS)
    expect(JSON.parse(target.getItem(BACKUP_KEYS.theme)!)).toBe('light')
  })

  it('restoring over DIFFERENT existing progress replaces all of it', () => {
    const file = JSON.stringify(buildBackup(memoryStore(SAVED), NOW))
    const other: Hunter = { ...DEFAULT_HUNTER, name: 'Someone Else', level: 40, xp: 9 }
    const target = memoryStore({
      [BACKUP_KEYS.hunter]: JSON.stringify(other),
      [BACKUP_KEYS.customQuests]: JSON.stringify([{ ...QUESTS[0], id: 'cq_other' }]),
      [BACKUP_KEYS.theme]: JSON.stringify('dark'),
    })
    const parsed = parseBackup(file)
    if (!parsed.ok) throw new Error('expected a valid backup')
    applyBackup(parsed.backup, target)
    expect(target.snapshot()).toEqual(SAVED)
  })

  it('a backup with no theme clears the theme choice rather than keeping the old one', () => {
    const noTheme = buildBackup(memoryStore({ [BACKUP_KEYS.hunter]: JSON.stringify(HUNTER) }), NOW)!
    const target = memoryStore({ [BACKUP_KEYS.theme]: JSON.stringify('dark') })
    applyBackup(noTheme, target)
    expect(target.getItem(BACKUP_KEYS.theme)).toBeNull()
  })

  it('an older-format save (none of the newer optional fields) still round-trips', () => {
    const old = {
      name: 'Old Timer', level: 3, xp: 60, statPoints: 6,
      stats: { STR: 12, VIT: 11, INT: 12, PER: 10, AGI: 10 },
      completedToday: { q_train: true }, lastQuestDate: '2026-09-01', streak: 4, syncedDate: null,
      log: [{ id: 1, date: '2026-09-01T10:00:00.000Z', label: 'Physical Training', xp: 25, stat: 'STR', questId: 'q_train' }],
      unlockedShadows: [], activeGate: null, clearedGates: [], logCount: 0, focusStats: [],
    }
    const source = memoryStore({ [BACKUP_KEYS.hunter]: JSON.stringify(old) })
    const parsed = parseBackup(JSON.stringify(buildBackup(source, NOW)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const target = memoryStore()
    applyBackup(parsed.backup, target)
    expect(JSON.parse(target.getItem(BACKUP_KEYS.hunter)!)).toEqual(old)
  })
})

describe('parseBackup rejects anything that is not a usable backup', () => {
  const valid = (): Backup => buildBackup(memoryStore(SAVED), NOW)!
  const withHunter = (patch: Record<string, unknown>) =>
    JSON.stringify({ ...valid(), data: { ...valid().data, hunter: { ...HUNTER, ...patch } } })

  it.each([
    ['not JSON at all', 'hello world', /valid JSON/],
    ['an empty file', '', /valid JSON/],
    ['JSON that is not an object', '[1, 2, 3]', /isn't a backup from this app/],
    ['some other app\'s export', JSON.stringify({ app: 'other', version: 1, data: {} }), /isn't a backup from this app/],
    ['a raw hunter save, not wrapped as a backup', JSON.stringify(HUNTER), /isn't a backup from this app/],
    ['a newer format version', JSON.stringify({ ...valid(), version: BACKUP_VERSION + 1 }), /newer version/],
    ['a backup with no data', JSON.stringify({ app: BACKUP_APP, version: 1 }), /incomplete/],
    ['a hunter with no name', withHunter({ name: '  ' }), /no name/],
    ['a non-numeric level', withHunter({ level: 'eleven' }), /invalid level/],
    ['negative XP', withHunter({ xp: -5 }), /invalid XP/],
    ['missing stats', withHunter({ stats: { STR: 1 } }), /invalid stats/],
    ['a log that is not a list', withHunter({ log: 'nope' }), /invalid activity log/],
    ['a malformed log entry', withHunter({ log: [{ label: 'x' }] }), /invalid activity log entry/],
    ['a log entry with an unknown stat', withHunter({ log: [{ ...HUNTER.log[0], stat: 'LUCK' }] }), /invalid activity log entry/],
    ['negative daily XP', withHunter({ dailyXP: { '2026-10-03': -1 } }), /invalid XP history/],
    ['malformed daily stat XP', withHunter({ dailyStatXP: { '2026-10-03': { STR: 10, LUCK: 2 } } }), /invalid stat history/],
    ['an active gate with an unknown template', withHunter({ activeGate: { templateId: 'gate_x', tier: 'X', name: 'X', startedAt: 1, expiresAt: 2, completedTasks: {} } }), /invalid active gate/],
    ['an active gate with a bogus task', withHunter({ activeGate: { templateId: 'gate_e', tier: 'E', name: 'E-Rank Gate', startedAt: 1, expiresAt: 2, completedTasks: { nope: true } } }), /invalid active gate/],
    ['unknown cleared gate', withHunter({ clearedGates: ['gate_x'] }), /invalid cleared gates/],
    ['unknown companion id', withHunter({ recruitedCompanions: ['not_real'] }), /invalid companions/],
    ['unknown companion milestone', withHunter({ unlockedShadows: [6] }), /invalid companion milestones/],
    ['negative ticket count', withHunter({ tickets: -1 }), /invalid ticket count/],
    ['negative echo shards', withHunter({ echoShards: -1 }), /invalid ticket count/],
    ['bad streak ticket date', withHunter({ lastStreakTicketDate: 'yesterday' }), /invalid ticket count/],
    ['unknown focus stat', withHunter({ focusStats: ['STR', 'LUCK'] }), /invalid focus stats/],
    ['unknown onboarding goal', withHunter({ goals: ['exercise', 'wizardry'] }), /invalid onboarding goals/],
    ['custom quests that are not a list', JSON.stringify({ ...valid(), data: { ...valid().data, customQuests: {} } }), /invalid custom quests/],
    ['a custom quest with a non-numeric tier XP', JSON.stringify({ ...valid(), data: { ...valid().data, customQuests: [{ ...QUESTS[0], tiers: [{ label: '1L', xp: '15' }] }] } }), /invalid custom quest tier/],
    ['an unknown theme value', JSON.stringify({ ...valid(), data: { ...valid().data, theme: 'sepia' } }), /invalid theme/],
  ])('%s', (_name, text, reason) => {
    const result = parseBackup(text)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(reason)
  })

  it('never throws, whatever it is given', () => {
    for (const junk of ['null', '0', '"str"', '{}', '{"app":null}', '\u0000\u0001', '{"data":']) {
      expect(() => parseBackup(junk)).not.toThrow()
      expect(parseBackup(junk).ok).toBe(false)
    }
  })
})

describe('applyBackup is all-or-nothing', () => {
  const EXISTING = {
    [BACKUP_KEYS.hunter]: JSON.stringify({ ...DEFAULT_HUNTER, name: 'Current', level: 7 }),
    [BACKUP_KEYS.customQuests]: JSON.stringify([]),
    [BACKUP_KEYS.theme]: JSON.stringify('dark'),
  }
  const backup = buildBackup(memoryStore(SAVED), NOW)!

  it.each([1, 2, 3])('if write #%i fails, the previous save is left exactly as it was', (n) => {
    const target = memoryStore(EXISTING, n)
    const result = applyBackup(backup, target)
    expect(result.ok).toBe(false)
    expect(target.snapshot()).toEqual(EXISTING)
  })

  it('a failed restore onto an empty browser leaves it empty (no half-written save)', () => {
    const target = memoryStore({}, 2)
    expect(applyBackup(backup, target).ok).toBe(false)
    expect(target.snapshot()).toEqual({})
  })
})

describe('job applications in backups', () => {
  it('survive export -> restore unchanged', () => {
    const parsed = parseBackup(JSON.stringify(buildBackup(memoryStore(SAVED), NOW)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const fresh = memoryStore()
    applyBackup(parsed.backup, fresh)
    expect(JSON.parse(fresh.getItem(BACKUP_KEYS.jobApplications)!)).toEqual(JOBS)
  })

  it('a backup from before the tracker restores with no applications, clearing any that were there', () => {
    const { [BACKUP_KEYS.jobApplications]: _jobs, ...older } = SAVED
    const backup = buildBackup(memoryStore(older), NOW)!
    expect('jobApplications' in backup.data).toBe(false)
    const target = memoryStore(SAVED)
    applyBackup(backup, target)
    expect(target.getItem(BACKUP_KEYS.jobApplications)).toBeNull()
  })

  it('rejects a backup whose applications are damaged', () => {
    const backup = buildBackup(memoryStore(SAVED), NOW)!
    const tampered = {
      ...backup,
      data: { ...backup.data, jobApplications: [{ ...JOBS[0], link: 'javascript:alert(1)' }] },
    }
    expect(parseBackup(JSON.stringify(tampered))).toEqual({
      ok: false,
      reason: 'That backup is damaged (invalid job application link).',
    })
  })
})

describe('goals in backups', () => {
  it('survive export -> restore unchanged', () => {
    const parsed = parseBackup(JSON.stringify(buildBackup(memoryStore(SAVED), NOW)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const fresh = memoryStore()
    applyBackup(parsed.backup, fresh)
    expect(JSON.parse(fresh.getItem(BACKUP_KEYS.trackedGoals)!)).toEqual(GOALS)
  })

  it('a backup from before the tracker restores with no goals', () => {
    const { [BACKUP_KEYS.trackedGoals]: _goals, ...older } = SAVED
    const backup = buildBackup(memoryStore(older), NOW)!
    expect('trackedGoals' in backup.data).toBe(false)
    const target = memoryStore(SAVED)
    applyBackup(backup, target)
    expect(target.getItem(BACKUP_KEYS.trackedGoals)).toBeNull()
  })

  it('rejects a backup whose goals are damaged', () => {
    const backup = buildBackup(memoryStore(SAVED), NOW)!
    const tampered = { ...backup, data: { ...backup.data, trackedGoals: [{ ...GOALS[0], status: 'someday' }] } }
    expect(parseBackup(JSON.stringify(tampered))).toEqual({
      ok: false,
      reason: 'That backup is damaged (invalid goal status).',
    })
  })
})

describe('skills, certs and projects in backups', () => {
  const keys = [
    ['skills', SKILL_ITEMS],
    ['certs', CERT_ITEMS],
    ['projects', PROJECT_ITEMS],
  ] as const

  it.each(keys)('%s survive export -> restore unchanged', (id, items) => {
    const parsed = parseBackup(JSON.stringify(buildBackup(memoryStore(SAVED), NOW)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const fresh = memoryStore()
    applyBackup(parsed.backup, fresh)
    expect(JSON.parse(fresh.getItem(BACKUP_KEYS[id])!)).toEqual(items)
  })

  it.each(keys)('a backup from before %s existed restores with none', (id) => {
    const { [BACKUP_KEYS[id]]: _dropped, ...older } = SAVED
    const backup = buildBackup(memoryStore(older), NOW)!
    expect(id in backup.data).toBe(false)
    const target = memoryStore(SAVED)
    applyBackup(backup, target)
    expect(target.getItem(BACKUP_KEYS[id])).toBeNull()
  })

  it('rejects a backup with a damaged list', () => {
    const backup = buildBackup(memoryStore(SAVED), NOW)!
    const tampered = {
      ...backup,
      data: { ...backup.data, certs: [{ ...CERT_ITEMS[0], link: 'javascript:alert(1)' }] },
    }
    expect(parseBackup(JSON.stringify(tampered)).ok).toBe(false)
  })
})

describe('profile photo in backups', () => {
  it('survives export -> restore byte for byte', () => {
    const exported = JSON.stringify(buildBackup(memoryStore(SAVED), NOW))
    const parsed = parseBackup(exported)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const fresh = memoryStore()
    applyBackup(parsed.backup, fresh)
    expect((JSON.parse(fresh.getItem(BACKUP_KEYS.hunter)!) as Hunter).photo).toBe(PHOTO)
  })

  it('a save with no photo round-trips with no photo', () => {
    const { photo: _photo, ...noPhoto } = HUNTER
    const store = memoryStore({ ...SAVED, [BACKUP_KEYS.hunter]: JSON.stringify(noPhoto) })
    const parsed = parseBackup(JSON.stringify(buildBackup(store, NOW)))
    expect(parsed.ok && 'photo' in parsed.backup.data.hunter).toBe(false)
  })

  it.each([
    ['not a string', 42],
    ['a web URL', 'https://example.com/me.jpg'],
    ['a script URL', 'javascript:alert(1)'],
    ['a non-image data URL', 'data:text/html;base64,PGgxPmhpPC9oMT4='],
    ['an SVG (can carry script)', 'data:image/svg+xml;base64,PHN2Zy8+'],
    ['an oversized image', `data:image/jpeg;base64,${'A'.repeat(300_000)}`],
  ])('rejects a backup whose photo is %s', (_name, photo) => {
    const backup = { ...buildBackup(memoryStore(SAVED), NOW)! }
    const tampered = { ...backup, data: { ...backup.data, hunter: { ...HUNTER, photo } } }
    const parsed = parseBackup(JSON.stringify(tampered))
    expect(parsed).toEqual({ ok: false, reason: 'That backup is damaged (invalid profile photo).' })
  })
})

describe('validateHunter', () => {
  it('accepts the default hunter once it has a name, and a full save', () => {
    expect(validateHunter({ ...DEFAULT_HUNTER, name: 'A' })).toBeNull()
    expect(validateHunter(HUNTER)).toBeNull()
  })

  it('rejects a hunter that has not finished setup (no name)', () => {
    expect(validateHunter(DEFAULT_HUNTER)).toMatch(/no name/)
  })
})

describe('backupFilename', () => {
  it('includes the hunter name and the date', () => {
    expect(backupFilename('Pramod', NOW)).toBe('tracker-backup-pramod-2026-10-03.json')
  })

  it('makes awkward names filesystem-safe', () => {
    expect(backupFilename('  Pramod K. / Über:Hunter  ', NOW)).toBe(
      'tracker-backup-pramod-k-ber-hunter-2026-10-03.json',
    )
    expect(backupFilename('🗡️', NOW)).toBe('tracker-backup-hunter-2026-10-03.json')
  })
})

// Guard: anything the app persists must be in the backup. Scans the source
// for storage keys and fails if one isn't listed in BACKUP_KEYS.
describe('every persisted key is backed up', () => {
  it('BACKUP_KEYS lists every p26_* storage key used in the source', () => {
    const sources = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })
    const used = new Set<string>()
    for (const [path, text] of Object.entries(sources)) {
      if (path.includes('.test.')) continue
      for (const m of (text as string).matchAll(/['"`](p26_[a-z0-9_]+)['"`]/g)) used.add(m[1])
    }
    expect([...used].sort()).toEqual(Object.values(BACKUP_KEYS).sort())
  })
})
