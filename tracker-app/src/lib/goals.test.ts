import { describe, expect, it } from 'vitest'
import {
  GOAL_CATEGORIES,
  emptyGoalDraft,
  goalCounts,
  goalDraftToFields,
  goalToDraft,
  isOverdue,
  relatedQuestName,
  sortGoals,
  validateGoalDraft,
  validateGoals,
  type Goal,
  type GoalDraft,
} from './goals'
import { GOAL_OPTIONS } from './onboarding'

const goal = (over: Partial<Goal> = {}): Goal => ({
  id: 'goal_1',
  title: 'Reach B2 German',
  category: 'learning',
  status: 'not_started',
  createdAt: '2026-10-01T09:00:00.000Z',
  ...over,
})
const draft = (over: Partial<GoalDraft> = {}): GoalDraft => ({
  title: 'Reach B2 German',
  category: 'learning',
  targetDate: '',
  status: 'not_started',
  ...over,
})

describe('categories', () => {
  it('are exactly the onboarding goal categories', () => {
    expect(GOAL_CATEGORIES).toBe(GOAL_OPTIONS)
    expect(GOAL_CATEGORIES.map((c) => c.label)).toEqual([
      'Physical / Fitness',
      'Skills / Learning',
      'Career / Networking',
      'Mindfulness / Recovery',
      'Hydration',
      'Daily Habits',
    ])
  })
})

describe('validateGoalDraft / goalDraftToFields', () => {
  it('only the title is required', () => {
    expect(validateGoalDraft(draft())).toEqual({})
    expect(validateGoalDraft(draft({ title: '  ' }))).toEqual({ title: 'Give the goal a title.' })
  })
  it('a target date is optional but must be a real date when given', () => {
    expect(validateGoalDraft(draft({ targetDate: '2026-12-31' }))).toEqual({})
    expect(Object.keys(validateGoalDraft(draft({ targetDate: '2026-02-30' })))).toEqual(['targetDate'])
  })
  it('trims the title and drops an empty target date', () => {
    expect(goalDraftToFields(draft({ title: '  Run 10K ' }))).toEqual({
      title: 'Run 10K',
      category: 'learning',
      status: 'not_started',
    })
  })
  it('a goal survives goal -> draft -> fields', () => {
    const g = goal({ targetDate: '2026-12-31', status: 'in_progress' })
    expect(goalDraftToFields(goalToDraft(g))).toEqual({
      title: g.title,
      category: g.category,
      status: g.status,
      targetDate: g.targetDate,
    })
  })
  it('a new draft is Not started with no date', () => {
    expect(emptyGoalDraft()).toMatchObject({ status: 'not_started', targetDate: '', title: '' })
  })
})

describe('sortGoals', () => {
  it('puts incomplete goals first — soonest target date first, undated last — then done ones', () => {
    const list = [
      goal({ id: 'done-new', status: 'done', createdAt: '2026-10-03T00:00:00.000Z' }),
      goal({ id: 'undated', createdAt: '2026-10-02T00:00:00.000Z' }),
      goal({ id: 'december', targetDate: '2026-12-31', status: 'in_progress' }),
      goal({ id: 'done-old', status: 'done', targetDate: '2026-01-01', createdAt: '2026-09-01T00:00:00.000Z' }),
      goal({ id: 'november', targetDate: '2026-11-15' }),
    ]
    expect(sortGoals(list).map((g) => g.id)).toEqual(['november', 'december', 'undated', 'done-new', 'done-old'])
    expect(list[0].id).toBe('done-new') // not mutated
  })
})

describe('goalCounts / isOverdue', () => {
  it('counts active and done', () => {
    expect(goalCounts([goal(), goal({ status: 'in_progress' }), goal({ status: 'done' })])).toEqual({
      active: 2,
      done: 1,
    })
  })
  it('overdue = a passed target date on a goal that is not done', () => {
    const now = new Date(2026, 9, 5)
    expect(isOverdue(goal({ targetDate: '2026-10-04' }), now)).toBe(true)
    expect(isOverdue(goal({ targetDate: '2026-10-05' }), now)).toBe(false) // due today
    expect(isOverdue(goal({ targetDate: '2026-10-04', status: 'done' }), now)).toBe(false)
    expect(isOverdue(goal(), now)).toBe(false)
  })
})

describe('relatedQuestName', () => {
  it('names the quest that tracks each category day to day', () => {
    expect(relatedQuestName('career')).toBe('Hunter Association')
    expect(relatedQuestName('exercise')).toBe('Physical Training')
    expect(relatedQuestName('learning')).toBe('Skill Grinding')
    expect(relatedQuestName('recovery')).toBe('Recovery Ritual')
    expect(relatedQuestName('custom')).toBe('Daily Discipline')
    expect(relatedQuestName('hydration')).toBe('Drinking Water')
  })
})

describe('validateGoals', () => {
  it('accepts a saved list and an empty one', () => {
    expect(validateGoals([])).toBeNull()
    expect(validateGoals([goal(), goal({ id: 'b', targetDate: '2026-12-31', status: 'done' })])).toBeNull()
  })
  it.each([
    ['not a list', 'goals'],
    ['a goal with no title', [goal({ title: '' })]],
    ['an unknown category', [{ ...goal(), category: 'finance' }]],
    ['an unknown status', [{ ...goal(), status: 'someday' }]],
    ['a bad date', [goal({ targetDate: 'soon' })]],
  ])('rejects %s', (_name, value) => {
    expect(validateGoals(value)).not.toBeNull()
  })
})
