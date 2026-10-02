import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_LIBRARY,
  activitiesIn,
  activityCategory,
  findActivity,
  gradientCss,
} from './activities'
import { QUEST_ICONS } from './customQuests'

describe('ACTIVITY_CATEGORIES', () => {
  it('has the six v1 categories with unique keys', () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.key)).toEqual([
      'exercise',
      'learning',
      'hydration',
      'recovery',
      'career',
      'custom',
    ])
  })

  it('every category has at least one activity', () => {
    for (const c of ACTIVITY_CATEGORIES) expect(activitiesIn(c.key).length).toBeGreaterThan(0)
  })
})

describe('ACTIVITY_LIBRARY', () => {
  it('has unique activity ids', () => {
    const ids = ACTIVITY_LIBRARY.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('stays a curated v1 set, not dozens of entries', () => {
    expect(ACTIVITY_LIBRARY.length).toBeGreaterThanOrEqual(15)
    expect(ACTIVITY_LIBRARY.length).toBeLessThanOrEqual(25)
  })

  it.each(ACTIVITY_LIBRARY.map((a) => [a.id, a] as const))(
    '%s: belongs to a real category, has a known icon, a 2-stop gradient, and fixed ascending tiers',
    (_id, a) => {
      expect(ACTIVITY_CATEGORIES.some((c) => c.key === a.category)).toBe(true)
      expect(QUEST_ICONS[a.iconKey]).toBeDefined()
      expect(a.gradient).toHaveLength(2)
      expect(a.tiers.length).toBeGreaterThanOrEqual(2)
      for (const t of a.tiers) {
        expect(Number.isInteger(t.xp)).toBe(true)
        expect(t.xp).toBeGreaterThan(0)
      }
      for (let i = 1; i < a.tiers.length; i++) expect(a.tiers[i].xp).toBeGreaterThan(a.tiers[i - 1].xp)
      expect(new Set(a.tiers.map((t) => t.label)).size).toBe(a.tiers.length)
    },
  )

  it('uses the specified tiers for Running and Drinking Water', () => {
    expect(findActivity('running')?.tiers).toEqual([
      { label: 'General 30 min', xp: 20 },
      { label: '5K', xp: 25 },
      { label: '10K', xp: 45 },
    ])
    expect(findActivity('water')?.tiers).toEqual([
      { label: '0.5L', xp: 8 },
      { label: '1L', xp: 15 },
      { label: '2L', xp: 25 },
    ])
  })

  it('has exactly one catch-all under Other, with fixed Light/Medium/Long tiers', () => {
    expect(activitiesIn('custom')).toEqual([findActivity('general')])
    expect(findActivity('general')?.tiers.map((t) => t.label)).toEqual(['Light', 'Medium', 'Long'])
  })

  it('gives every activity a distinct background gradient', () => {
    const gradients = ACTIVITY_LIBRARY.map((a) => a.gradient.join('>'))
    expect(new Set(gradients).size).toBe(gradients.length)
  })
})

describe('lookups', () => {
  it('findActivity returns undefined for an unknown id', () => {
    expect(findActivity('nope')).toBeUndefined()
  })

  it('activityCategory falls back to Other for an unknown key', () => {
    // @ts-expect-error deliberately invalid key
    expect(activityCategory('nonexistent').key).toBe('custom')
  })

  it('gradientCss builds a 135° linear-gradient', () => {
    expect(gradientCss(['#000', '#fff'])).toBe('linear-gradient(135deg, #000, #fff)')
  })
})
