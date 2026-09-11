import { describe, expect, it } from 'vitest'
import { DAILY_LOG_CAP, DAILY_QUESTS, LOG_XP_TIERS } from './quests'

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
