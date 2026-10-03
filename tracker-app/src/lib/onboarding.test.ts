import { describe, expect, it } from 'vitest'
import { ACTIVITY_CATEGORIES, findActivity } from './activities'
import {
  BODY_FIELDS,
  FIXED_QUEST_GOAL,
  GOAL_OPTIONS,
  focusStatsForGoals,
  hiddenQuestIdsForGoals,
  parseOptionalNumber,
  starterActivitiesForGoals,
} from './onboarding'
import { DAILY_QUESTS } from './quests'

describe('GOAL_OPTIONS', () => {
  it('offers exactly the activity library categories — no second category list', () => {
    expect(GOAL_OPTIONS.map((g) => g.key).sort()).toEqual(ACTIVITY_CATEGORIES.map((c) => c.key).sort())
  })

  it('leads with the four named goals', () => {
    expect(GOAL_OPTIONS.slice(0, 4).map((g) => g.label)).toEqual([
      'Physical / Fitness',
      'Skills / Learning',
      'Career / Networking',
      'Mindfulness / Recovery',
    ])
  })
})

describe('FIXED_QUEST_GOAL', () => {
  it('maps every fixed quest to a real goal, one quest per goal', () => {
    const goalKeys = GOAL_OPTIONS.map((g) => g.key)
    for (const q of DAILY_QUESTS) expect(goalKeys).toContain(FIXED_QUEST_GOAL[q.id])
    expect(new Set(Object.values(FIXED_QUEST_GOAL)).size).toBe(DAILY_QUESTS.length)
  })

  it('uses the obvious mapping', () => {
    expect(FIXED_QUEST_GOAL).toEqual({
      q_train: 'exercise',
      q_learn: 'learning',
      q_hunt: 'career',
      q_recover: 'recovery',
      q_discipline: 'custom',
    })
  })
})

describe('hiddenQuestIdsForGoals', () => {
  it('hides every fixed quest whose goal was not picked', () => {
    expect(hiddenQuestIdsForGoals(['exercise', 'learning'])).toEqual([
      'q_hunt',
      'q_recover',
      'q_discipline',
    ])
  })

  it('without Career, Hunter Association starts hidden; without Fitness, Physical Training does', () => {
    expect(hiddenQuestIdsForGoals(['exercise', 'learning', 'recovery', 'custom'])).toEqual(['q_hunt'])
    expect(hiddenQuestIdsForGoals(['learning', 'career', 'recovery', 'custom'])).toEqual(['q_train'])
  })

  it('hides nothing when every quest-backed goal is picked', () => {
    expect(hiddenQuestIdsForGoals(['exercise', 'learning', 'career', 'recovery', 'custom'])).toEqual([])
  })

  it('a goal with no fixed quest (Hydration) hides all five on its own', () => {
    expect(hiddenQuestIdsForGoals(['hydration'])).toEqual(DAILY_QUESTS.map((q) => q.id))
  })
})

describe('starterActivitiesForGoals', () => {
  it('gives Hydration its library quest, since no fixed quest covers it', () => {
    expect(starterActivitiesForGoals(['exercise', 'hydration'])).toEqual(['water'])
    expect(findActivity('water')?.category).toBe('hydration')
  })

  it('adds nothing for goals that already have a fixed quest', () => {
    expect(starterActivitiesForGoals(['exercise', 'learning', 'career', 'recovery', 'custom'])).toEqual([])
  })
})

describe('focusStatsForGoals', () => {
  it('maps goals to their stats without duplicates', () => {
    expect(focusStatsForGoals(['exercise', 'career'])).toEqual(['STR', 'PER'])
    // Recovery and Hydration both point at VIT.
    expect(focusStatsForGoals(['recovery', 'hydration'])).toEqual(['VIT'])
  })
})

describe('parseOptionalNumber', () => {
  it('blank is valid and means "not provided"', () => {
    expect(parseOptionalNumber('  ', 5, 120)).toEqual({ value: undefined, valid: true })
  })

  it('accepts in-range numbers, including a decimal comma, rounded to 1 dp', () => {
    expect(parseOptionalNumber('28', 5, 120)).toEqual({ value: 28, valid: true })
    expect(parseOptionalNumber('74,56', 20, 400)).toEqual({ value: 74.6, valid: true })
  })

  it('rejects out-of-range and non-numeric input', () => {
    expect(parseOptionalNumber('3', 5, 120).valid).toBe(false)
    expect(parseOptionalNumber('999', 50, 260).valid).toBe(false)
    expect(parseOptionalNumber('abc', 5, 120)).toEqual({ value: undefined, valid: false })
  })
})

describe('BODY_FIELDS', () => {
  it('is age, height (cm), weight (kg)', () => {
    expect(BODY_FIELDS.map((f) => `${f.key}:${f.unit}`)).toEqual([
      'age:yrs',
      'heightCm:cm',
      'weightKg:kg',
    ])
  })
})
