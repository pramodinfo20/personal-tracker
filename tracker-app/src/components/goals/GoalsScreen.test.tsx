// @vitest-environment jsdom
// The Goals tracker running on the real useGoals hook.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useGoals } from '../../hooks/useGoals'
import type { Goal } from '../../lib/goals'
import { GoalsScreen } from './GoalsScreen'

function Harness() {
  const g = useGoals()
  return (
    <GoalsScreen
      goals={g.goals}
      onAdd={g.addGoal}
      onUpdate={g.updateGoal}
      onSetStatus={g.setGoalStatus}
      onDelete={g.deleteGoal}
      onBack={() => {}}
    />
  )
}

const saved = () => JSON.parse(localStorage.getItem('p26_goals') ?? '[]') as Goal[]
const seed = (goals: Goal[]) => localStorage.setItem('p26_goals', JSON.stringify(goals))
const goal = (over: Partial<Goal>): Goal => ({
  id: 'goal_a',
  title: 'Reach B2 German',
  category: 'learning',
  status: 'not_started',
  createdAt: '2026-10-01T09:00:00.000Z',
  ...over,
})

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const inSheet = (name: string) => within(screen.getByRole('dialog')).getByRole('button', { name })
const count = (label: string) =>
  within(screen.getByLabelText('Goal counts')).getByText(label).previousSibling?.textContent
const order = () => screen.getAllByRole('button', { name: /^Edit / }).map((b) => b.getAttribute('aria-label'))

describe('GoalsScreen', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('starts empty', () => {
    render(<Harness />)
    expect(screen.getByText('No goals yet')).toBeTruthy()
    expect(count('Active')).toBe('0')
    expect(count('Done')).toBe('0')
  })

  it('add: the title is required; the card shows category, status, date and the related quest', () => {
    render(<Harness />)
    fireEvent.click(button('Add goal'))
    fireEvent.click(inSheet('Add goal'))
    expect(screen.getByRole('alert').textContent).toBe('Give the goal a title.')
    expect(saved()).toEqual([])

    fireEvent.change(screen.getByLabelText('Goal (required)'), { target: { value: 'Land a data role in Germany' } })
    fireEvent.click(screen.getByRole('radio', { name: /Career \/ Networking/ }))
    expect(within(screen.getByRole('dialog')).getByText('Tracked via Hunter Association quest.')).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/^Target date/), { target: { value: '2099-06-30' } })
    fireEvent.click(inSheet('Add goal'))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(saved()).toMatchObject([
      { title: 'Land a data role in Germany', category: 'career', targetDate: '2099-06-30', status: 'not_started' },
    ])
    const card = button('Edit Land a data role in Germany')
    expect(card.textContent).toContain('Not started')
    expect(card.textContent).toContain('Career / Networking')
    expect(card.textContent).toContain('Due Jun 30, 2099')
    expect(card.textContent).toContain('Tracked via Hunter Association quest')
    expect(count('Active')).toBe('1')
  })

  it('edit: opens prefilled; title, category and status can be changed', () => {
    seed([goal({})])
    render(<Harness />)
    fireEvent.click(button('Edit Reach B2 German'))
    expect((screen.getByLabelText('Goal (required)') as HTMLInputElement).value).toBe('Reach B2 German')
    expect(screen.getByRole('radio', { name: /Skills \/ Learning/ }).getAttribute('aria-checked')).toBe('true')

    fireEvent.change(screen.getByLabelText('Goal (required)'), { target: { value: 'Reach C1 German' } })
    fireEvent.click(screen.getByRole('radio', { name: 'In progress' }))
    fireEvent.click(button('Save changes'))

    expect(saved()).toMatchObject([
      { id: 'goal_a', title: 'Reach C1 German', status: 'in_progress', createdAt: '2026-10-01T09:00:00.000Z' },
    ])
    expect(button('Edit Reach C1 German').textContent).toContain('In progress')
  })

  it('mark complete: one tap on the card, moves it below the active goals, and can be reopened', () => {
    seed([goal({ id: 'a', title: 'First' }), goal({ id: 'b', title: 'Second', createdAt: '2026-09-01T00:00:00.000Z' })])
    render(<Harness />)
    expect(order()).toEqual(['Edit First', 'Edit Second'])

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark First done' }))
    expect(saved().find((g) => g.id === 'a')?.status).toBe('done')
    expect(order()).toEqual(['Edit Second', 'Edit First'])
    expect(button('Edit First').textContent).toContain('Done')
    expect(count('Active')).toBe('1')
    expect(count('Done')).toBe('1')
    expect(screen.queryByRole('dialog')).toBeNull() // didn't open the editor

    fireEvent.click(screen.getByRole('checkbox', { name: 'Reopen First' }))
    expect(saved().find((g) => g.id === 'a')?.status).toBe('in_progress')
    expect(count('Done')).toBe('0')
  })

  it('delete: asks first, and "Keep it" backs out', () => {
    seed([goal({ id: 'a', title: 'First' }), goal({ id: 'b', title: 'Second' })])
    render(<Harness />)
    fireEvent.click(button('Edit Second'))
    fireEvent.click(button('Delete goal'))
    fireEvent.click(button('Keep it'))
    expect(saved()).toHaveLength(2)

    fireEvent.click(button('Delete goal'))
    fireEvent.click(button('Yes, delete'))
    expect(saved().map((g) => g.title)).toEqual(['First'])
    expect(screen.queryByRole('button', { name: 'Edit Second' })).toBeNull()
  })

  it('flags an overdue goal, but not a done one', () => {
    seed([
      goal({ id: 'a', title: 'Late', targetDate: '2020-01-01' }),
      goal({ id: 'b', title: 'Finished', targetDate: '2020-01-01', status: 'done' }),
    ])
    render(<Harness />)
    expect(button('Edit Late').textContent).toContain('Overdue')
    expect(button('Edit Finished').textContent).not.toContain('Overdue')
  })
})
