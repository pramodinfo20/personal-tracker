import { describe, expect, it } from 'vitest'
import { QUEST_CATEGORIES } from './customQuests'
import type { LogEntry } from './hunterState'
import {
  allQuestsClaimed,
  DAILY_LOG_CAP,
  DAILY_QUESTS,
  formatTierXPRange,
  isValidTier,
  questClaimEntry,
  questXPOnDate,
  tierXPRange,
} from './quests'

const quest = (id: string) => DAILY_QUESTS.find((q) => q.id === id)!

describe('quest/log constants', () => {
  it('caps daily free-text logs at 3', () => {
    expect(DAILY_LOG_CAP).toBe(3)
  })

  it('has 5 daily quests, one per stat', () => {
    expect(DAILY_QUESTS).toHaveLength(5)
    expect(DAILY_QUESTS.map((q) => q.stat).sort()).toEqual(
      ['AGI', 'INT', 'PER', 'STR', 'VIT'].sort(),
    )
  })

  it('keeps the same quest ids as before tiers, so old completedToday/questId data still matches', () => {
    expect(DAILY_QUESTS.map((q) => q.id)).toEqual([
      'q_train',
      'q_learn',
      'q_hunt',
      'q_recover',
      'q_discipline',
    ])
  })

  it('gives each daily quest its tier list', () => {
    expect(quest('q_train').tiers).toEqual([
      { label: '15 min', xp: 15 },
      { label: '30 min', xp: 25 },
      { label: '45 min', xp: 35 },
      { label: '60+ min', xp: 50 },
    ])
    expect(quest('q_learn').tiers.map((t) => t.xp)).toEqual([15, 25, 40])
    expect(quest('q_hunt').tiers.map((t) => t.xp)).toEqual([15, 20, 30])
    expect(quest('q_recover').tiers).toEqual([{ label: 'Done', xp: 15 }])
    expect(quest('q_discipline').tiers).toEqual([{ label: 'Done', xp: 10 }])
  })

  // Every built-in tier list in the app — fixed quests and the category
  // presets custom quests / Log Activity draw from.
  it.each([
    ...DAILY_QUESTS.map((q) => [q.id, q.tiers] as const),
    ...QUEST_CATEGORIES.map((c) => [c.key, c.defaultTiers] as const),
  ])(
    '%s: tiers are non-empty, strictly ascending in xp, with unique labels',
    (_id, tiers) => {
      expect(tiers.length).toBeGreaterThan(0)
      for (let i = 1; i < tiers.length; i++) expect(tiers[i].xp).toBeGreaterThan(tiers[i - 1].xp)
      expect(new Set(tiers.map((t) => t.label)).size).toBe(tiers.length)
    },
  )
})

describe('isValidTier', () => {
  const tiers = quest('q_train').tiers

  it('accepts a tier from the list', () => {
    expect(isValidTier(tiers, { label: '30 min', xp: 25 })).toBe(true)
  })

  it('rejects a tier whose xp was tampered with', () => {
    expect(isValidTier(tiers, { label: '30 min', xp: 999 })).toBe(false)
  })

  it("rejects another quest's tier", () => {
    expect(isValidTier(tiers, quest('q_recover').tiers[0])).toBe(false)
  })
})

describe('tierXPRange / formatTierXPRange', () => {
  it('gives min/max across tiers', () => {
    expect(tierXPRange(quest('q_train').tiers)).toEqual({ min: 15, max: 50 })
  })

  it('formats a range for multi-tier and a single value for single-tier', () => {
    expect(formatTierXPRange(quest('q_train').tiers)).toBe('+15–50')
    expect(formatTierXPRange(quest('q_discipline').tiers)).toBe('+10')
  })
})

describe('allQuestsClaimed', () => {
  it('is false when nothing is claimed', () => {
    expect(allQuestsClaimed({})).toBe(false)
  })

  it('is false when some but not all quests are claimed', () => {
    const partial = Object.fromEntries(DAILY_QUESTS.slice(0, 3).map((q) => [q.id, true]))
    expect(allQuestsClaimed(partial)).toBe(false)
  })

  it('is true only once every quest id is claimed', () => {
    const all = Object.fromEntries(DAILY_QUESTS.map((q) => [q.id, true]))
    expect(allQuestsClaimed(all)).toBe(true)
  })
})

const entry = (over: Partial<LogEntry>): LogEntry => ({
  id: Math.random(),
  date: '2026-10-02T09:00:00.000Z',
  label: 'x',
  xp: 10,
  stat: 'STR',
  ...over,
})

describe('questClaimEntry', () => {
  it("finds today's claim entry for a quest", () => {
    const e = entry({ questId: 'q_train', xp: 35, tier: '45 min' })
    expect(questClaimEntry([e], 'q_train', '2026-10-02')).toBe(e)
  })

  it('finds an old pre-tier claim entry (no tier field) the same way', () => {
    const old = entry({ questId: 'q_train', xp: 25 })
    expect(questClaimEntry([old], 'q_train', '2026-10-02')).toBe(old)
  })

  it("ignores a previous day's claim of the same quest", () => {
    const yesterday = entry({ questId: 'q_train', date: '2026-10-01T09:00:00.000Z' })
    expect(questClaimEntry([yesterday], 'q_train', '2026-10-02')).toBeUndefined()
  })

  it('ignores entries without a questId (log activity, gates)', () => {
    expect(questClaimEntry([entry({ label: 'Physical Training' })], 'q_train', '2026-10-02'))
      .toBeUndefined()
  })
})

describe('questXPOnDate', () => {
  it("sums only that day's fixed-quest claims, old and new alike", () => {
    const log = [
      entry({ questId: 'q_train', xp: 50, tier: '60+ min' }),
      entry({ questId: 'q_learn', xp: 25 }), // pre-tier entry
      entry({ xp: 20, category: 'learning', tier: '30 min' }), // log activity — not a quest
      entry({ questId: 'cq_abc', xp: 15, tier: '1L' }), // custom quest — not one of the fixed 5
      entry({ questId: 'q_hunt', xp: 30, date: '2026-10-01T09:00:00.000Z' }), // yesterday
    ]
    expect(questXPOnDate(log, '2026-10-02')).toBe(75)
  })

  it('can be scoped to a different quest set (e.g. custom quests)', () => {
    const log = [entry({ questId: 'cq_abc', xp: 15 }), entry({ questId: 'q_train', xp: 50 })]
    expect(questXPOnDate(log, '2026-10-02', [{ id: 'cq_abc' }])).toBe(15)
  })

  it('is 0 for an empty/missing log', () => {
    expect(questXPOnDate([], '2026-10-02')).toBe(0)
  })
})
