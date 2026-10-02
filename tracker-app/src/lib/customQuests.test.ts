import { describe, expect, it } from 'vitest'
import {
  QUEST_ICONS,
  activeCustomQuests,
  customQuestToClaimable,
  questCategoryLabel,
  questIcon,
  type CustomQuest,
} from './customQuests'

describe('questCategoryLabel', () => {
  it('labels every category key a saved quest can carry — including pre-library ones', () => {
    expect(questCategoryLabel('exercise')).toBe('Exercise')
    expect(questCategoryLabel('hydration')).toBe('Hydration')
    expect(questCategoryLabel('learning')).toBe('Reading / Learning')
    expect(questCategoryLabel('recovery')).toBe('Mindfulness / Recovery')
    expect(questCategoryLabel('career')).toBe('Career / Networking')
    expect(questCategoryLabel('custom')).toBe('Other')
  })
})

describe('QUEST_ICONS', () => {
  it('still resolves every icon key that pre-library quests could have saved', () => {
    for (const key of ['droplet', 'dumbbell', 'book', 'moon', 'star', 'run', 'brain', 'heart', 'pen', 'target']) {
      expect(QUEST_ICONS[key]).toBeDefined()
    }
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

describe('customQuestToClaimable', () => {
  it('maps a stored custom quest onto the shared ClaimableQuest shape, tiers untouched', () => {
    const tiers = [
      { label: '0.5L', xp: 8 },
      { label: '2L', xp: 25 },
    ]
    const q: CustomQuest = {
      id: 'cq_h',
      name: 'Water',
      category: 'hydration',
      iconKey: 'droplet',
      statKey: 'VIT',
      tiers,
      active: true,
    }
    expect(customQuestToClaimable(q)).toEqual({
      id: 'cq_h',
      icon: '💧',
      label: 'Water',
      hint: 'Hydration',
      stat: 'VIT',
      tiers,
    })
  })
})
