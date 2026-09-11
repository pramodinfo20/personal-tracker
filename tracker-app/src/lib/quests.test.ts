import { describe, expect, it } from 'vitest'
import { allQuestsClaimed, DAILY_LOG_CAP, DAILY_QUESTS, LOG_XP_TIERS, totalDailyQuestXP } from './quests'

describe('quest/log constants', () => {
  it('has 3 log XP tiers in ascending order: light, moderate, intense', () => {
    expect(LOG_XP_TIERS.map((t) => t.key)).toEqual(['light', 'moderate', 'intense'])
    expect(LOG_XP_TIERS.map((t) => t.xp)).toEqual([10, 20, 35])
  })

  it('caps daily free-text logs at 3', () => {
    expect(DAILY_LOG_CAP).toBe(3)
  })

  it('has 5 daily quests, one per stat', () => {
    expect(DAILY_QUESTS).toHaveLength(5)
    expect(DAILY_QUESTS.map((q) => q.stat).sort()).toEqual(
      ['AGI', 'INT', 'PER', 'STR', 'VIT'].sort(),
    )
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

describe('totalDailyQuestXP', () => {
  it('sums every quest xp value', () => {
    expect(totalDailyQuestXP()).toBe(DAILY_QUESTS.reduce((s, q) => s + q.xp, 0))
    expect(totalDailyQuestXP()).toBe(95)
  })
})
