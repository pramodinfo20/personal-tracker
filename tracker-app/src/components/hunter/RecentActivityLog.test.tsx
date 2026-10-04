// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LogEntry } from '../../lib/hunterState'
import { RecentActivityLog } from './RecentActivityLog'

const now = new Date().toISOString()
const yesterday = new Date(Date.now() - 86_400_000).toISOString()

const LOG: LogEntry[] = [
  { id: 4, date: now, label: 'Running: Riverside', xp: 45, stat: 'STR', tier: '10K', category: 'exercise' },
  { id: 3, date: now, label: 'Skill Grinding', xp: 25, stat: 'INT', questId: 'q_learn', tier: '30 min' },
  { id: 2, date: now, label: 'Gate cleared: E-Rank Gate', xp: 120, stat: 'GATE' },
  { id: 1, date: yesterday, label: 'Reading', xp: 20, stat: 'INT', tier: '30 min', category: 'learning' },
]

describe('RecentActivityLog — undo for logged activities', () => {
  afterEach(cleanup)

  it("offers Undo only on TODAY's logged activities — not quest claims, gates, or older logs", () => {
    render(<RecentActivityLog log={LOG} onUndoActivity={vi.fn(() => ({ ok: true }))} />)
    const undoButtons = screen.getAllByRole('button', { name: /^Undo / })
    expect(undoButtons).toHaveLength(1)
    expect(undoButtons[0].getAttribute('aria-label')).toBe('Undo Running: Riverside')
  })

  it('undoes only after the inline confirm, passing the entry id', () => {
    const onUndo = vi.fn(() => ({ ok: true }))
    render(<RecentActivityLog log={LOG} onUndoActivity={onUndo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo Running: Riverside' }))
    expect(onUndo).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, undo' }))
    expect(onUndo).toHaveBeenCalledWith(4)
  })

  it('Cancel backs out without undoing', () => {
    const onUndo = vi.fn(() => ({ ok: true }))
    render(<RecentActivityLog log={LOG} onUndoActivity={onUndo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo Running: Riverside' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onUndo).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Yes, undo' })).toBeNull()
  })

  it('shows the reason when the undo is refused', () => {
    const onUndo = vi.fn(() => ({ ok: false, reason: 'Would strand D-rank access.' }))
    render(<RecentActivityLog log={LOG} onUndoActivity={onUndo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo Running: Riverside' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, undo' }))
    expect(screen.getByRole('alert').textContent).toBe('Would strand D-rank access.')
  })

  it('is read-only when no undo handler is given', () => {
    render(<RecentActivityLog log={LOG} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Running: Riverside')).toBeTruthy()
  })
})
