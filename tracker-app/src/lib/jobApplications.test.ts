import { describe, expect, it } from 'vitest'
import {
  applicationStats,
  applicationToDraft,
  applicationsOn,
  draftToFields,
  emptyDraft,
  formatAppliedDate,
  huntQuest,
  huntTierForActions,
  isDateKey,
  localDateKey,
  normalizeLink,
  sortApplications,
  validateDraft,
  validateJobApplications,
  type JobApplication,
  type JobApplicationDraft,
} from './jobApplications'

const app = (over: Partial<JobApplication> = {}): JobApplication => ({
  id: 'job_1',
  company: 'Siemens',
  role: 'Data Engineer',
  dateApplied: '2026-10-05',
  status: 'applied',
  createdAt: '2026-10-05T09:00:00.000Z',
  ...over,
})
const draft = (over: Partial<JobApplicationDraft> = {}): JobApplicationDraft => ({
  company: 'Siemens',
  role: 'Data Engineer',
  dateApplied: '2026-10-05',
  status: 'applied',
  notes: '',
  link: '',
  ...over,
})

describe('dates', () => {
  it('localDateKey is the local calendar day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('isDateKey accepts real dates only', () => {
    expect(isDateKey('2026-10-05')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('05/10/2026')).toBe(false)
    expect(isDateKey('')).toBe(false)
    expect(isDateKey(undefined)).toBe(false)
  })
  it('formatAppliedDate shows the year only when it is not this year', () => {
    const now = new Date(2026, 9, 5)
    expect(formatAppliedDate('2026-10-03', now)).toBe('Oct 3')
    expect(formatAppliedDate('2025-12-30', now)).toBe('Dec 30, 2025')
  })
})

describe('normalizeLink', () => {
  it('keeps http(s) links and adds https:// to a bare address', () => {
    expect(normalizeLink('https://jobs.siemens.com/123')).toEqual({ ok: true, link: 'https://jobs.siemens.com/123' })
    expect(normalizeLink(' jobs.siemens.com/123 ')).toEqual({ ok: true, link: 'https://jobs.siemens.com/123' })
  })
  it('empty means no link', () => {
    expect(normalizeLink('   ')).toEqual({ ok: true })
  })
  it.each(['javascript:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', 'not a link', 'localhost'])(
    'refuses %s',
    (raw) => {
      expect(normalizeLink(raw)).toEqual({ ok: false })
    },
  )
})

describe('validateDraft / draftToFields', () => {
  it('company is the only required text', () => {
    expect(validateDraft(draft({ role: '', notes: '', link: '' }))).toEqual({})
    expect(validateDraft(draft({ company: '   ' }))).toEqual({ company: 'Company is required.' })
  })
  it('flags a bad date and a bad link', () => {
    const problems = validateDraft(draft({ dateApplied: '', link: 'javascript:alert(1)' }))
    expect(Object.keys(problems).sort()).toEqual(['dateApplied', 'link'])
  })
  it('trims, and drops empty optional fields', () => {
    expect(draftToFields(draft({ company: '  Siemens ', role: ' DE ', notes: '  ', link: '' }))).toEqual({
      company: 'Siemens',
      role: 'DE',
      dateApplied: '2026-10-05',
      status: 'applied',
    })
  })
  it('an application survives draft -> fields -> draft', () => {
    const a = app({ notes: 'Referral from Anna', link: 'https://jobs.siemens.com/123', status: 'interview' })
    expect(draftToFields(applicationToDraft(a))).toEqual({
      company: a.company,
      role: a.role,
      dateApplied: a.dateApplied,
      status: a.status,
      notes: a.notes,
      link: a.link,
    })
  })
  it('a new draft defaults to today and Applied', () => {
    expect(emptyDraft(new Date(2026, 9, 5))).toMatchObject({ dateApplied: '2026-10-05', status: 'applied' })
  })
})

describe('sortApplications', () => {
  it('is newest first by date applied, then by when it was added', () => {
    const list = [
      app({ id: 'a', dateApplied: '2026-10-01' }),
      app({ id: 'b', dateApplied: '2026-10-05', createdAt: '2026-10-05T08:00:00.000Z' }),
      app({ id: 'c', dateApplied: '2026-10-05', createdAt: '2026-10-05T10:00:00.000Z' }),
      app({ id: 'd', dateApplied: '2026-09-20' }),
    ]
    expect(sortApplications(list).map((a) => a.id)).toEqual(['c', 'b', 'a', 'd'])
    expect(list.map((a) => a.id)).toEqual(['a', 'b', 'c', 'd']) // not mutated
  })
})

describe('applicationStats', () => {
  // Wednesday 7 Oct 2026 — the week is Mon 5 .. Sun 11.
  const now = new Date(2026, 9, 7, 12)
  const on = (dateApplied: string, id = dateApplied) => app({ id, dateApplied })

  it('counts the calendar week (Mon–Sun) and the calendar month', () => {
    const list = [
      on('2026-10-05'), // Monday — in week
      on('2026-10-07'),
      on('2026-10-11'), // Sunday — in week
      on('2026-10-04'), // previous Sunday — month only
      on('2026-10-01'),
      on('2026-09-30'), // neither
    ]
    expect(applicationStats(list, now)).toEqual({ thisWeek: 3, thisMonth: 5, total: 6 })
  })

  it('a week that straddles two months counts both sides', () => {
    // Thursday 1 Oct 2026 — the week is Mon 28 Sep .. Sun 4 Oct.
    const list = [on('2026-09-28'), on('2026-09-30'), on('2026-10-02')]
    expect(applicationStats(list, new Date(2026, 9, 1))).toEqual({ thisWeek: 3, thisMonth: 1, total: 3 })
  })

  it('is all zeros for no applications', () => {
    expect(applicationStats([], now)).toEqual({ thisWeek: 0, thisMonth: 0, total: 0 })
  })
})

describe('Hunter Association tier', () => {
  it('uses the real quest tiers: 1–2, 3–4, 5+ actions', () => {
    const tiers = huntQuest().tiers
    expect([1, 2, 3, 4, 5, 9].map((n) => huntTierForActions(n))).toEqual([
      tiers[0],
      tiers[0],
      tiers[1],
      tiers[1],
      tiers[2],
      tiers[2],
    ])
  })
  it('applicationsOn counts one day', () => {
    const list = [app({ id: 'a' }), app({ id: 'b' }), app({ id: 'c', dateApplied: '2026-10-04' })]
    expect(applicationsOn(list, '2026-10-05')).toBe(2)
  })
})

describe('validateJobApplications', () => {
  it('accepts a saved list, including optional fields and an empty list', () => {
    expect(validateJobApplications([])).toBeNull()
    expect(
      validateJobApplications([app(), app({ id: 'b', notes: 'n', link: 'https://example.com/job' })]),
    ).toBeNull()
  })
  it.each([
    ['not a list', { a: 1 }],
    ['an entry with no company', [app({ company: ' ' })]],
    ['an unknown status', [{ ...app(), status: 'ghosted' }]],
    ['a bad date', [app({ dateApplied: '2026-13-01' })]],
    ['a script link', [app({ link: 'javascript:alert(1)' })]],
    ['a non-string note', [{ ...app(), notes: 5 }]],
  ])('rejects %s', (_name, value) => {
    expect(validateJobApplications(value)).not.toBeNull()
  })
})
