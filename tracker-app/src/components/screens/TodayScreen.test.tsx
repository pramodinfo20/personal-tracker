// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CustomQuest } from '../../lib/customQuests'
import { DEFAULT_HUNTER, type Hunter } from '../../lib/hunterState'
import { DAILY_QUESTS } from '../../lib/quests'
import { TodayScreen } from './TodayScreen'

const water: CustomQuest = {
  id: 'cq_w',
  name: 'Drinking Water',
  category: 'hydration',
  iconKey: 'droplet',
  statKey: 'VIT',
  tiers: [{ label: '1L', xp: 15 }],
  active: true,
}

const setup = (hunterOver: Partial<Hunter> = {}, customQuests: CustomQuest[] = []) => {
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
  render(<TodayScreen hunter={hunter} customQuests={customQuests} {...handlers} />)
  return handlers
}

const shown = (label: string) => screen.queryByText(label) !== null

describe('TodayScreen — quest visibility', () => {
  afterEach(cleanup)

  it('shows all 5 built-in quests for a save with no hiddenQuestIds', () => {
    setup()
    for (const q of DAILY_QUESTS) expect(shown(q.label)).toBe(true)
    expect(shown('No quests enabled')).toBe(false)
  })

  it('hides disabled built-in quests and inactive custom quests with the same filter', () => {
    setup({ hiddenQuestIds: ['q_train', 'q_hunt'] }, [
      water,
      { ...water, id: 'cq_off', name: 'Evening Walk', active: false },
    ])
    expect(shown('Physical Training')).toBe(false)
    expect(shown('Hunter Association')).toBe(false)
    expect(shown('Skill Grinding')).toBe(true)
    expect(shown('Drinking Water')).toBe(true)
    expect(shown('Evening Walk')).toBe(false)
  })

  it('with everything disabled: friendly empty state with a button to Manage Quests', () => {
    const handlers = setup({ hiddenQuestIds: DAILY_QUESTS.map((q) => q.id) }, [
      { ...water, active: false },
    ])
    expect(shown('No quests enabled')).toBe(true)
    expect(shown('Manage your quests to add some back.')).toBe(true)
    for (const q of DAILY_QUESTS) expect(shown(q.label)).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Manage Quests' }))
    expect(handlers.onManageQuests).toHaveBeenCalledTimes(1)
  })

  it('no empty state when built-ins are all hidden but a custom quest is still on', () => {
    setup({ hiddenQuestIds: DAILY_QUESTS.map((q) => q.id) }, [water])
    expect(shown('No quests enabled')).toBe(false)
    expect(shown('Drinking Water')).toBe(true)
  })

  it('Day Complete counts only the enabled built-in quests', () => {
    setup({
      hiddenQuestIds: ['q_train', 'q_hunt'],
      completedToday: { q_learn: true, q_recover: true, q_discipline: true },
    })
    expect(shown('Day Complete!')).toBe(true)
    expect(screen.getByText(/All 3 quests cleared/)).toBeTruthy()
  })

  it('claiming a visible quest still goes through the same handler', () => {
    const handlers = setup({ hiddenQuestIds: ['q_train'] })
    fireEvent.click(screen.getByRole('button', { name: /Daily Discipline/ }))
    expect(handlers.onClaimQuest).toHaveBeenCalledWith(
      DAILY_QUESTS.find((q) => q.id === 'q_discipline'),
      { label: 'Done', xp: 10 },
    )
  })
})
