import { describe, expect, it } from 'vitest'
import {
  QUEST_CATEGORIES,
  QUEST_ICONS,
  activeCustomQuests,
  questCategory,
  questIcon,
  type CustomQuest,
} from './customQuests'

describe('QUEST_CATEGORIES', () => {
  it('has one preset per category, each with at least one tier', () => {
    expect(QUEST_CATEGORIES).toHaveLength(5)
    for (const c of QUEST_CATEGORIES) {
      expect(c.defaultTiers.length).toBeGreaterThan(0)
      expect(QUEST_ICONS[c.iconKey]).toBeDefined()
    }
  })

  it('has unique category keys', () => {
    const keys = QUEST_CATEGORIES.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every default tier has a positive xp value', () => {
    for (const c of QUEST_CATEGORIES) {
      for (const t of c.defaultTiers) {
        expect(t.xp).toBeGreaterThan(0)
      }
    }
  })
})

describe('questCategory', () => {
  it('finds a preset by key', () => {
    expect(questCategory('exercise').label).toBe('Exercise')
  })

  it('falls back to the last preset for an unknown key', () => {
    // @ts-expect-error deliberately invalid key
    expect(questCategory('nonexistent').key).toBe('custom')
  })
})

describe('questIcon', () => {
  it('resolves a known icon key to its emoji', () => {
    expect(questIcon('droplet')).toBe('💧')
  })

  it('falls back to the default icon for an unknown key', () => {
    expect(questIcon('nonexistent')).toBe(QUEST_ICONS.star)
  })
})

describe('activeCustomQuests', () => {
  const quest = (overrides: Partial<CustomQuest>): CustomQuest => ({
    id: 'cq_1',
    name: 'Test quest',
    category: 'custom',
    iconKey: 'star',
    statKey: 'PER',
    tiers: [{ label: 'Light', xp: 10 }],
    active: true,
    ...overrides,
  })

  it('keeps only active quests', () => {
    const quests = [quest({ id: 'a', active: true }), quest({ id: 'b', active: false })]
    expect(activeCustomQuests(quests).map((q) => q.id)).toEqual(['a'])
  })
})
