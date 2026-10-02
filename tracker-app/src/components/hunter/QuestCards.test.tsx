// @vitest-environment jsdom
// Behavior guard for the visual restyle: claim/undo interactions on the
// quest cards must be exactly what they were — only the styling changed.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LogEntry } from '../../lib/hunterState'
import { DAILY_QUESTS } from '../../lib/quests'
import { QuestCards } from './QuestCards'

const quest = (id: string) => DAILY_QUESTS.find((q) => q.id === id)!
const todayIso = () => new Date().toISOString()

describe('QuestCards (restyled) — behavior unchanged', () => {
  afterEach(cleanup)

  it('a single-tier quest claims in one tap with its only tier', () => {
    const onClaim = vi.fn()
    render(
      <QuestCards quests={DAILY_QUESTS} completedToday={{}} log={[]} onClaim={onClaim} onUndo={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Daily Discipline/ }))
    expect(onClaim).toHaveBeenCalledWith(quest('q_discipline'), { label: 'Done', xp: 10 })
  })

  it('a multi-tier quest opens the picker; picking a tier is the claim', () => {
    const onClaim = vi.fn()
    render(
      <QuestCards quests={DAILY_QUESTS} completedToday={{}} log={[]} onClaim={onClaim} onUndo={vi.fn()} />,
    )
    const card = screen.getByRole('button', { name: /Physical Training/ })
    fireEvent.click(card)
    expect(card.getAttribute('aria-expanded')).toBe('true')
    expect(onClaim).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /45 min/ }))
    expect(onClaim).toHaveBeenCalledWith(quest('q_train'), { label: '45 min', xp: 35 })
  })

  it('a claimed card shows its tier/XP and undoes only after the inline confirm', () => {
    const onUndo = vi.fn(() => ({ ok: true }))
    const log: LogEntry[] = [
      { id: 1, date: todayIso(), label: 'Skill Grinding', xp: 25, stat: 'INT', questId: 'q_learn', tier: '30 min' },
    ]
    const { container } = render(
      <QuestCards
        quests={DAILY_QUESTS}
        completedToday={{ q_learn: true }}
        log={log}
        onClaim={vi.fn()}
        onUndo={onUndo}
      />,
    )
    expect(screen.getByText('+25 XP · 30 min')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, undo' }))
    expect(onUndo).toHaveBeenCalledWith(quest('q_learn'))
    // Every card keeps a stable .hud-enter wrapper, staggered in order.
    const wrappers = [...container.querySelectorAll<HTMLElement>('.hud-enter')]
    expect(wrappers).toHaveLength(DAILY_QUESTS.length)
    expect(wrappers.map((w) => w.style.getPropertyValue('--i'))).toEqual(['0', '1', '2', '3', '4'])
  })

  it('shows a refused undo reason on the card', () => {
    const onUndo = vi.fn(() => ({ ok: false, reason: 'Would strand a gate.' }))
    const log: LogEntry[] = [
      { id: 1, date: todayIso(), label: 'Physical Training', xp: 50, stat: 'STR', questId: 'q_train' },
    ]
    render(
      <QuestCards
        quests={[quest('q_train')]}
        completedToday={{ q_train: true }}
        log={log}
        onClaim={vi.fn()}
        onUndo={onUndo}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, undo' }))
    expect(within(document.body).getByText('Would strand a gate.')).toBeTruthy()
  })

  it('tints each card by its stat tier and claimed cards by success', () => {
    const { container } = render(
      <QuestCards
        quests={DAILY_QUESTS}
        completedToday={{ q_hunt: true }}
        log={[]}
        onClaim={vi.fn()}
        onUndo={vi.fn()}
      />,
    )
    const glass = [...container.querySelectorAll('.hud-glass')].map((el) =>
      [...el.classList].find((c) => c.startsWith('glow-')),
    )
    expect(glass).toEqual(['glow-red', 'glow-purple', 'glow-success', 'glow-bronze', 'glow-gold'])
  })
})
