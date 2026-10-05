// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from '../../lib/hunterState'
import { DevTestingPanel, LIVE_WARNING, type DevActions } from './DevTestingPanel'

const HUNTER: Hunter = { ...DEFAULT_HUNTER, name: 'Tester', level: 12, unlockedShadows: [5, 10], tickets: 2 }

const mount = (hunter: Hunter = HUNTER) => {
  const dev: DevActions = {
    resetHunter: vi.fn(),
    jumpToLevel: vi.fn(),
    clearGateHistory: vi.fn(),
    grantTickets: vi.fn(),
    setStreak: vi.fn(),
  }
  render(<DevTestingPanel hunter={hunter} dev={dev} onClose={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /Dev Testing/ }))
  return dev
}
const setNumber = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('DevTestingPanel', () => {
  afterEach(cleanup)

  it('is collapsed until opened', () => {
    render(
      <DevTestingPanel
        hunter={HUNTER}
        dev={{ resetHunter: vi.fn(), jumpToLevel: vi.fn(), clearGateHistory: vi.fn(), grantTickets: vi.fn(), setStreak: vi.fn() }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Grant tickets' })).toBeNull()
  })

  it('Set level passes the chosen level', () => {
    const dev = mount()
    expect((screen.getByLabelText('Set level:') as HTMLInputElement).value).toBe('12')
    setNumber('Set level:', '50')
    fireEvent.click(screen.getByRole('button', { name: 'Set level' }))
    expect(dev.jumpToLevel).toHaveBeenCalledWith(50)
  })

  it('Grant tickets passes the chosen count', () => {
    const dev = mount()
    setNumber('Lottery tickets:', '10')
    fireEvent.click(screen.getByRole('button', { name: 'Grant tickets' }))
    expect(dev.grantTickets).toHaveBeenCalledWith(10)
  })

  it('Set streak defaults to 7 and passes the chosen days', () => {
    const dev = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Set streak' }))
    expect(dev.setStreak).toHaveBeenCalledWith(7)
    setNumber('Streak (days):', '14')
    fireEvent.click(screen.getByRole('button', { name: 'Set streak' }))
    expect(dev.setStreak).toHaveBeenLastCalledWith(14)
  })

  it('shows the current level, tickets, streak and open ranks', () => {
    mount()
    const current = screen.getByTestId('dev-current').textContent
    expect(current).toContain('Level 12')
    expect(current).toContain('2 ticket(s)')
    expect(current).toContain('0-day streak')
    expect(current).toContain('ranks open: D C')
  })

  it('on a live build shows the real-data warning, open or collapsed; never on a dev build', () => {
    const dev: DevActions = {
      resetHunter: vi.fn(),
      jumpToLevel: vi.fn(),
      clearGateHistory: vi.fn(),
      grantTickets: vi.fn(),
      setStreak: vi.fn(),
    }
    const { rerender } = render(<DevTestingPanel hunter={HUNTER} dev={dev} onClose={vi.fn()} live />)
    expect(screen.getByRole('alert').textContent).toContain(LIVE_WARNING)
    expect(LIVE_WARNING).toBe(
      'Live build — these tools overwrite your real saved data (Set streak fabricates history). Use a separate browser profile/incognito, or Download Backup first.',
    )
    fireEvent.click(screen.getByRole('button', { name: /Dev Testing/ }))
    expect(screen.getByRole('alert').textContent).toContain(LIVE_WARNING)

    rerender(<DevTestingPanel hunter={HUNTER} dev={dev} onClose={vi.fn()} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
