import { describe, expect, it } from 'vitest'
import {
  CERTS,
  PROJECTS,
  SKILLS,
  TRACKERS,
  emptyTrackerDraft,
  isExpired,
  itemToDraft,
  sortTrackerItems,
  trackerDraftToFields,
  validateTrackerDraft,
  validateTrackerItems,
  type TrackerItem,
} from './trackers'

const item = (fields: Record<string, string>): TrackerItem =>
  ({ id: 'x_1', createdAt: '2026-10-01T09:00:00.000Z', ...fields }) as TrackerItem

describe('tracker definitions', () => {
  it.each(TRACKERS)('$title: the first field is the required title, and keys are unique', (def) => {
    expect(def.fields[0]).toMatchObject({ key: 'title', kind: 'text', required: true })
    const keys = def.fields.map((f) => f.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).not.toContain('id')
    expect(keys).not.toContain('createdAt')
  })

  it('have the fields asked for', () => {
    expect(SKILLS.fields.map((f) => f.key)).toEqual(['title', 'category', 'level', 'notes'])
    expect(CERTS.fields.map((f) => f.key)).toEqual(['title', 'issuer', 'dateEarned', 'expiryDate', 'link'])
    expect(PROJECTS.fields.map((f) => f.key)).toEqual(['title', 'description', 'status', 'link'])
  })

  it('offer the right choices', () => {
    const labels = (def: typeof SKILLS, key: string) => {
      const f = def.fields.find((x) => x.key === key)
      return f?.kind === 'choice' ? f.options.map((o) => o.label) : []
    }
    expect(labels(SKILLS, 'level')).toEqual(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    expect(labels(PROJECTS, 'status')).toEqual(['Planning', 'In progress', 'Done', 'Paused'])
  })
})

describe('drafts', () => {
  it('a new draft is empty, with each choice on its first option', () => {
    expect(emptyTrackerDraft(SKILLS)).toEqual({ title: '', category: '', level: 'beginner', notes: '' })
    expect(emptyTrackerDraft(PROJECTS)).toEqual({ title: '', description: '', status: 'planning', link: '' })
  })

  it.each(TRACKERS)('$title: only the title is required', (def) => {
    expect(validateTrackerDraft(def, { ...emptyTrackerDraft(def), title: 'Something' })).toEqual({})
    expect(Object.keys(validateTrackerDraft(def, emptyTrackerDraft(def)))).toEqual(['title'])
  })

  it('flags a bad link and a bad date', () => {
    const draft = { ...emptyTrackerDraft(CERTS), title: 'AWS', link: 'javascript:alert(1)', dateEarned: '2026-02-30' }
    expect(Object.keys(validateTrackerDraft(CERTS, draft)).sort()).toEqual(['dateEarned', 'link'])
  })

  it('certs: expiry cannot be before the date earned', () => {
    const draft = { ...emptyTrackerDraft(CERTS), title: 'AWS', dateEarned: '2026-03-01', expiryDate: '2025-03-01' }
    expect(validateTrackerDraft(CERTS, draft)).toEqual({ expiryDate: "Expiry can't be before the date earned." })
  })

  it('stores trimmed values, normalised links, and drops empty optional fields', () => {
    const draft = { title: '  Tracker app ', description: '', status: 'done', link: 'github.com/pramod/tracker' }
    expect(trackerDraftToFields(PROJECTS, draft)).toEqual({
      title: 'Tracker app',
      status: 'done',
      link: 'https://github.com/pramod/tracker',
    })
  })

  it('an item survives item -> draft -> fields', () => {
    const fields = { title: 'SQL', category: 'Data', level: 'advanced', notes: 'Window functions' }
    expect(trackerDraftToFields(SKILLS, itemToDraft(SKILLS, item(fields)))).toEqual(fields)
  })
})

describe('cards', () => {
  const now = new Date(2026, 9, 5)

  it('skills: category, proficiency pill, notes', () => {
    const view = SKILLS.card(item({ title: 'SQL', category: 'Data', level: 'expert', notes: 'n' }), now)
    expect(view).toMatchObject({ subtitle: 'Data', pill: { label: 'Expert' }, note: 'n' })
  })

  it('projects: description, status pill, link', () => {
    const view = PROJECTS.card(
      item({ title: 'App', description: 'A PWA', status: 'paused', link: 'https://example.com/' }),
      now,
    )
    expect(view).toMatchObject({
      subtitle: 'A PWA',
      pill: { label: 'Paused' },
      link: { href: 'https://example.com/', label: 'Open link' },
    })
  })

  it('certs: an expired cert gets a warning pill; a valid or non-expiring one gets none', () => {
    const expired = CERTS.card(item({ title: 'A', issuer: 'Amazon', dateEarned: '2023-01-10', expiryDate: '2026-10-04' }), now)
    expect(expired.pill?.label).toBe('Expired')
    expect(expired.pill?.className).toContain('warning')
    expect(expired.meta).toBe('Earned Jan 10, 2023 · Expired Oct 4')
    expect(expired.subtitle).toBe('Amazon')

    const valid = CERTS.card(item({ title: 'A', expiryDate: '2027-01-01' }), now)
    expect(valid.pill).toBeUndefined()
    expect(valid.meta).toBe('Expires Jan 1, 2027')

    expect(CERTS.card(item({ title: 'A' }), now)).toMatchObject({ pill: undefined, meta: undefined })
  })

  it('isExpired: the expiry day itself is still valid', () => {
    expect(isExpired(item({ title: 'A', expiryDate: '2026-10-05' }), now)).toBe(false)
    expect(isExpired(item({ title: 'A', expiryDate: '2026-10-04' }), now)).toBe(true)
    expect(isExpired(item({ title: 'A' }), now)).toBe(false)
  })
})

describe('sortTrackerItems', () => {
  it('is newest added first', () => {
    const list = [
      { ...item({ title: 'old' }), id: 'a', createdAt: '2026-01-01T00:00:00.000Z' },
      { ...item({ title: 'new' }), id: 'b', createdAt: '2026-10-01T00:00:00.000Z' },
    ] as TrackerItem[]
    expect(sortTrackerItems(list).map((i) => i.id)).toEqual(['b', 'a'])
  })
})

describe('validateTrackerItems', () => {
  it('accepts saved lists, including an empty one', () => {
    expect(validateTrackerItems(SKILLS, [])).toBeNull()
    expect(validateTrackerItems(SKILLS, [item({ title: 'SQL', level: 'advanced' })])).toBeNull()
    expect(
      validateTrackerItems(CERTS, [item({ title: 'AWS', link: 'https://aws.amazon.com/verify/abc' })]),
    ).toBeNull()
  })

  it.each([
    ['not a list', SKILLS, { a: 1 }],
    ['no title', SKILLS, [item({ level: 'advanced' })]],
    ['an unknown choice', SKILLS, [item({ title: 'SQL', level: 'wizard' })]],
    ['a missing choice', PROJECTS, [item({ title: 'App' })]],
    ['a bad date', CERTS, [item({ title: 'AWS', expiryDate: 'never' })]],
    ['a script link', CERTS, [item({ title: 'AWS', link: 'javascript:alert(1)' })]],
    ['an unknown field', SKILLS, [item({ title: 'SQL', level: 'advanced', extra: 'x' })]],
    ['a non-string value', SKILLS, [{ ...item({ title: 'SQL', level: 'advanced' }), notes: 5 }]],
  ])('rejects %s', (_name, def, value) => {
    expect(validateTrackerItems(def, value)).not.toBeNull()
  })
})
