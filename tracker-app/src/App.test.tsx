// @vitest-environment jsdom
// App-level gating: setup shows only for a genuinely fresh install, and an
// existing save is never shown it or modified by it.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { DEFAULT_HUNTER, type Hunter } from './lib/hunterState'

const HUNTER_KEY = 'p26_hunter'
const QUESTS_KEY = 'p26_custom_quests'

const stored = (): Hunter => JSON.parse(localStorage.getItem(HUNTER_KEY)!)
const button = (name: RegExp | string) => screen.getByRole('button', { name })
const today = () => new Date().toISOString().split('T')[0]

const completeSetup = (goals: RegExp[]) => {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Jin' } })
  fireEvent.click(button('Continue'))
  fireEvent.click(button('Skip'))
  for (const g of goals) fireEvent.click(button(g))
  fireEvent.click(button('Start Hunting'))
}

describe('App — first-launch setup', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('a fresh install (no save) opens setup and nothing else', () => {
    render(<App />)
    expect(screen.getByRole('dialog', { name: 'Welcome setup' })).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('finishing setup pre-hides the built-in quests whose goals were not picked', () => {
    render(<App />)
    completeSetup([/Physical \/ Fitness/, /Skills \/ Learning/])

    expect(screen.queryByRole('dialog', { name: 'Welcome setup' })).toBeNull()
    expect(stored()).toMatchObject({
      name: 'Jin',
      goals: ['exercise', 'learning'],
      hiddenQuestIds: ['q_hunt', 'q_recover', 'q_discipline'],
    })
    // Today shows exactly the two matching quests.
    expect(screen.getByText('Physical Training')).toBeTruthy()
    expect(screen.getByText('Skill Grinding')).toBeTruthy()
    expect(screen.queryByText('Hunter Association')).toBeNull()
    expect(screen.queryByText('Recovery Ritual')).toBeNull()
    expect(screen.queryByText('Daily Discipline')).toBeNull()
  })

  it('picking Hydration adds the library Drinking Water quest (no built-in quest covers it)', () => {
    render(<App />)
    completeSetup([/Hydration/])
    const quests = JSON.parse(localStorage.getItem(QUESTS_KEY)!)
    expect(quests).toHaveLength(1)
    expect(quests[0]).toMatchObject({ activityId: 'water', name: 'Drinking Water', active: true })
    expect(screen.getByText('Drinking Water')).toBeTruthy()
  })

  it('an existing save skips setup and its quest visibility is left exactly as it was', () => {
    const existing: Hunter = {
      ...DEFAULT_HUNTER,
      name: 'Pramod',
      level: 4,
      xp: 120,
      lastQuestDate: today(),
      hiddenQuestIds: ['q_hunt'],
    }
    localStorage.setItem(HUNTER_KEY, JSON.stringify(existing))
    render(<App />)

    expect(screen.queryByRole('dialog', { name: 'Welcome setup' })).toBeNull()
    expect(screen.getByRole('navigation')).toBeTruthy()
    expect(stored().hiddenQuestIds).toEqual(['q_hunt'])
    expect(stored().goals).toBeUndefined()
    expect(stored()).toMatchObject({ name: 'Pramod', level: 4, xp: 120 })
  })

  it('an old save with no hiddenQuestIds at all still shows all five quests, no setup', () => {
    localStorage.setItem(
      HUNTER_KEY,
      JSON.stringify({ ...DEFAULT_HUNTER, name: 'Old Timer', lastQuestDate: today() }),
    )
    render(<App />)
    expect(screen.queryByRole('dialog', { name: 'Welcome setup' })).toBeNull()
    for (const label of ['Physical Training', 'Skill Grinding', 'Hunter Association', 'Recovery Ritual', 'Daily Discipline']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
    expect(stored().hiddenQuestIds).toBeUndefined()
  })

  it('Today\'s "Manage Quests →" hint opens the Manage Quests screen', () => {
    localStorage.setItem(
      HUNTER_KEY,
      JSON.stringify({ ...DEFAULT_HUNTER, name: 'Pramod', lastQuestDate: today() }),
    )
    render(<App />)
    fireEvent.click(button(/Want different quests\?/))
    expect(screen.getByRole('dialog', { name: 'Manage quests' })).toBeTruthy()
  })

  it('"Retake setup" in Profile reopens the flow prefilled, and can be cancelled without changes', () => {
    localStorage.setItem(
      HUNTER_KEY,
      JSON.stringify({
        ...DEFAULT_HUNTER,
        name: 'Pramod',
        lastQuestDate: today(),
        hiddenQuestIds: ['q_hunt'],
      }),
    )
    render(<App />)
    fireEvent.click(button('Open profile'))
    fireEvent.click(button(/Retake setup/))
    const dialog = screen.getByRole('dialog', { name: 'Retake setup' })
    expect(dialog).toBeTruthy()
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Pramod')
    fireEvent.click(button('Cancel'))
    expect(screen.queryByRole('dialog', { name: 'Retake setup' })).toBeNull()
    expect(stored().hiddenQuestIds).toEqual(['q_hunt'])
  })
})
