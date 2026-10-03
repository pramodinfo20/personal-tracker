import { describe, expect, it } from 'vitest'
import type { CustomQuest } from './customQuests'
import { questEntries, toggleHiddenQuest, visibleQuests } from './questVisibility'
import { allQuestsClaimed, DAILY_QUESTS } from './quests'

const custom = (over: Partial<CustomQuest>): CustomQuest => ({
  id: 'cq_1',
  name: 'Drinking Water',
  category: 'hydration',
  iconKey: 'droplet',
  statKey: 'VIT',
  tiers: [{ label: '1L', xp: 15 }],
  active: true,
  ...over,
})

describe('questEntries', () => {
  it('lists the 5 fixed quests then every custom quest, in order', () => {
    const entries = questEntries([], [custom({ id: 'a' }), custom({ id: 'b', active: false })])
    expect(entries.map((e) => e.quest.id)).toEqual([...DAILY_QUESTS.map((q) => q.id), 'a', 'b'])
    expect(entries.map((e) => e.kind)).toEqual([
      'fixed',
      'fixed',
      'fixed',
      'fixed',
      'fixed',
      'custom',
      'custom',
    ])
  })

  it('treats a save with no hiddenQuestIds as everything enabled (existing users see no change)', () => {
    const entries = questEntries(undefined, [])
    expect(entries).toHaveLength(5)
    expect(entries.every((e) => e.enabled)).toBe(true)
  })

  it('fixed quests are disabled by hiddenQuestIds; custom quests by their own active flag', () => {
    const entries = questEntries(['q_train', 'q_hunt'], [custom({ id: 'a', active: false })])
    const enabled = Object.fromEntries(entries.map((e) => [e.quest.id, e.enabled]))
    expect(enabled).toEqual({
      q_train: false,
      q_learn: true,
      q_hunt: false,
      q_recover: true,
      q_discipline: true,
      a: false,
    })
  })

  it('ignores unknown ids in hiddenQuestIds', () => {
    expect(questEntries(['not_a_quest'], []).every((e) => e.enabled)).toBe(true)
  })
})

describe('visibleQuests', () => {
  it('applies the same filter to both kinds', () => {
    const entries = questEntries(
      ['q_train'],
      [custom({ id: 'on' }), custom({ id: 'off', active: false })],
    )
    expect(visibleQuests(entries).map((e) => e.quest.id)).toEqual([
      'q_learn',
      'q_hunt',
      'q_recover',
      'q_discipline',
      'on',
    ])
  })

  it('is empty when everything is disabled', () => {
    const entries = questEntries(
      DAILY_QUESTS.map((q) => q.id),
      [custom({ active: false })],
    )
    expect(visibleQuests(entries)).toEqual([])
  })
})

describe('toggleHiddenQuest', () => {
  it('hides and re-shows a fixed quest', () => {
    const hidden = toggleHiddenQuest(undefined, 'q_train', false)
    expect(hidden).toEqual(['q_train'])
    expect(toggleHiddenQuest(hidden, 'q_train', true)).toEqual([])
  })

  it('never stores duplicates when hiding twice', () => {
    expect(toggleHiddenQuest(['q_train'], 'q_train', false)).toEqual(['q_train'])
  })

  it('ignores ids that are not fixed quests (custom quests use their own active flag)', () => {
    expect(toggleHiddenQuest(['q_train'], 'cq_1', false)).toEqual(['q_train'])
  })
})

describe('allQuestsClaimed with a visible subset', () => {
  const visibleFixed = DAILY_QUESTS.filter((q) => q.id !== 'q_train' && q.id !== 'q_hunt')

  it('is true once every ENABLED fixed quest is claimed, even with hidden ones unclaimed', () => {
    const done = { q_learn: true, q_recover: true, q_discipline: true }
    expect(allQuestsClaimed(done, visibleFixed)).toBe(true)
    // The default (all 5) would still say no — hidden quests must not block Day Complete.
    expect(allQuestsClaimed(done)).toBe(false)
  })

  it('is never true for an empty list (nothing enabled is not "day complete")', () => {
    expect(allQuestsClaimed({}, [])).toBe(false)
  })
})
