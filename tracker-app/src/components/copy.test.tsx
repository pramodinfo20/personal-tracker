// @vitest-environment jsdom
// Each catchphrase in lib/copy.ts shows up where it's meant to, alongside
// (never instead of) the functional text and buttons.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LEVEL_UP_COPY, MANAGE_QUESTS_COPY, ONBOARDING_COPY, TODAY_COPY } from '../lib/copy'
import { DEFAULT_HUNTER, type Hunter } from '../lib/hunterState'
import { rankForLevel } from '../lib/leveling'
import { questEntries } from '../lib/questVisibility'
import { DAILY_QUESTS } from '../lib/quests'
import { LevelUpOverlay, ManageQuestsSheet } from './hunter'
import { OnboardingFlow } from './onboarding'
import { TodayScreen } from './screens/TodayScreen'

const shown = (text: string) => screen.queryByText(text) !== null
const button = (name: RegExp | string) => screen.getByRole('button', { name })

const today = (hunterOver: Partial<Hunter> = {}, extra: Record<string, unknown> = {}) => {
  const handlers = {
    onClaimQuest: vi.fn(),
    onClaimCustomQuest: vi.fn(),
    onUndoQuest: vi.fn(() => ({ ok: true })),
    onLogActivity: vi.fn(),
    onManageQuests: vi.fn(),
    onStartGate: vi.fn(),
    onCompleteGateTask: vi.fn(),
    onGateExpire: vi.fn(),
  }
  const hunter: Hunter = { ...DEFAULT_HUNTER, name: 'Tester', ...hunterOver }
  render(<TodayScreen hunter={hunter} customQuests={[]} {...handlers} {...extra} />)
  return handlers
}

describe('catchphrases', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('every phrase is a single short line', () => {
    const all = [ONBOARDING_COPY, LEVEL_UP_COPY, TODAY_COPY, MANAGE_QUESTS_COPY].flatMap((g) =>
      Object.values(g),
    )
    expect(all).toHaveLength(7)
    for (const phrase of all) {
      expect(phrase).not.toMatch(/\n/)
      expect(phrase.length).toBeLessThanOrEqual(60)
    }
  })

  it('onboarding: each step shows its own line under the heading, with the step still usable', () => {
    render(<OnboardingFlow onComplete={vi.fn()} />)
    expect(shown(ONBOARDING_COPY.name)).toBe(true)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Jin' } })
    fireEvent.click(button('Continue'))

    expect(shown(ONBOARDING_COPY.name)).toBe(false)
    expect(shown(ONBOARDING_COPY.body)).toBe(true)
    expect(screen.getByText(/Optional — shown on your profile only/)).toBeTruthy()
    fireEvent.click(button('Skip'))

    expect(shown(ONBOARDING_COPY.goals)).toBe(true)
    expect(screen.getByText(/Pick everything that applies/)).toBeTruthy()
  })

  it('Today: the welcome banner shows only when asked, and can be dismissed', () => {
    today()
    expect(shown(ONBOARDING_COPY.complete)).toBe(false)
    cleanup()

    const onDismissWelcome = vi.fn()
    today({}, { showWelcome: true, onDismissWelcome })
    expect(screen.getByRole('status').textContent).toContain(ONBOARDING_COPY.complete)
    fireEvent.click(button('Dismiss welcome'))
    expect(onDismissWelcome).toHaveBeenCalledTimes(1)
  })

  it('Today: the welcome banner dismisses itself after a few seconds', () => {
    vi.useFakeTimers()
    const onDismissWelcome = vi.fn()
    today({}, { showWelcome: true, onDismissWelcome })
    vi.advanceTimersByTime(5000)
    expect(onDismissWelcome).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1500)
    expect(onDismissWelcome).toHaveBeenCalledTimes(1)
  })

  it('Today: the empty state adds its line and keeps the message and Manage Quests button', () => {
    const handlers = today({ hiddenQuestIds: DAILY_QUESTS.map((q) => q.id) })
    expect(shown(TODAY_COPY.emptyQuests)).toBe(true)
    expect(shown('No quests enabled')).toBe(true)
    expect(shown('Manage your quests to add some back.')).toBe(true)
    fireEvent.click(button('Manage Quests'))
    expect(handlers.onManageQuests).toHaveBeenCalled()
  })

  it('Today: no empty-state line while quests are showing', () => {
    today()
    expect(shown(TODAY_COPY.emptyQuests)).toBe(false)
  })

  it('level-up overlay: adds the line without replacing the level', () => {
    const event = { level: 7, rank: rankForLevel(7), rankUp: false, gained: 1, statPoints: 3 }
    render(<LevelUpOverlay event={event} onDismiss={vi.fn()} />)
    expect(shown(LEVEL_UP_COPY.encouragement)).toBe(true)
    expect(shown('You have reached Level 7')).toBe(true)
    expect(shown('LEVEL UP!')).toBe(true)
  })

  it('Manage Quests: subtitle sits with the existing count line', () => {
    render(
      <ManageQuestsSheet
        entries={questEntries([], [])}
        completedToday={{}}
        onSetEnabled={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(shown(MANAGE_QUESTS_COPY.subtitle)).toBe(true)
    expect(screen.getByText(/Choose which quests show on Today/)).toBeTruthy()
  })
})
