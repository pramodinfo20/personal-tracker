// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SummonResult } from '../../hooks/useHunter'
import { COMPANIONS, type CompanionRank } from '../../lib/companions'
import type { TicketState } from '../../lib/lottery'
import { MonsterCompanionsGrid } from './MonsterCompanionsGrid'
import { SummonSheet } from './SummonSheet'

const WOLF = COMPANIONS.find((c) => c.name === 'Grey Wolf')!
const tickets = (n: number, claimCount = 2): TicketState => ({
  tickets: n,
  claimCount,
  claimTicketsAwarded: 0,
})
const result = (duplicate = false): SummonResult => ({ companion: WOLF, duplicate })

const mount = (n: number, ranks: CompanionRank[] = ['D', 'C'], onSummon = vi.fn(() => result())) => {
  render(<SummonSheet tickets={tickets(n)} ranks={ranks} onSummon={onSummon} onClose={vi.fn()} rollMs={1500} />)
  return onSummon
}
const summonButton = () => screen.getByRole('button', { name: /Summon|No tickets/ }) as HTMLButtonElement

describe('SummonSheet', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows the ticket count, progress, and the odds for unlocked ranks only', () => {
    mount(2)
    expect(screen.getByTestId('ticket-count').textContent).toBe('2')
    expect(screen.getByText('Next ticket in 3 claims')).toBeTruthy()
    const odds = within(screen.getByLabelText('Draw odds by rank')).getAllByRole('listitem')
    expect(odds.map((o) => o.textContent)).toEqual(['D 71%', 'C 29%'])
    expect(screen.getByText(/earned, never bought/)).toBeTruthy()
  })

  it('a draw rolls first, then reveals the companion and its rank', () => {
    const onSummon = mount(2)
    fireEvent.click(summonButton())
    expect(onSummon).toHaveBeenCalledTimes(1)
    // Rolling: no result yet, and the button can't be pressed again.
    expect(screen.getByTestId('summon-roll')).toBeTruthy()
    expect(screen.queryByTestId('summon-result')).toBeNull()
    expect(summonButton().disabled).toBe(true)
    fireEvent.click(summonButton())
    expect(onSummon).toHaveBeenCalledTimes(1)

    act(() => void vi.advanceTimersByTime(1400))
    expect(screen.queryByTestId('summon-result')).toBeNull()
    act(() => void vi.advanceTimersByTime(200))

    const revealed = within(screen.getByTestId('summon-result'))
    expect(revealed.getByText('Grey Wolf')).toBeTruthy()
    expect(revealed.getByText('D-rank')).toBeTruthy()
    // The hero is the rank's artwork, in the rank's colour.
    expect(screen.getByTestId('summon-art').getAttribute('src')).toMatch(/companion-d[^/]*\.jpg/)
    expect(screen.getByTestId('summon-result').className).toContain('rank-d')
    expect(revealed.getByText('New companion recruited!')).toBeTruthy()
    expect(screen.queryByTestId('summon-roll')).toBeNull()
    expect(summonButton().textContent).toBe('Summon again (1 ticket)')
  })

  it('a duplicate is acknowledged as one', () => {
    mount(1, ['D'], vi.fn(() => result(true)))
    fireEvent.click(summonButton())
    act(() => void vi.advanceTimersByTime(1600))
    expect(within(screen.getByTestId('summon-result')).getByText('You already have this one.')).toBeTruthy()
    expect(screen.queryByText('New companion recruited!')).toBeNull()
  })

  it('with no tickets the button is disabled and nothing is drawn', () => {
    const onSummon = mount(0)
    expect(summonButton().disabled).toBe(true)
    expect(summonButton().textContent).toBe('No tickets')
    fireEvent.click(summonButton())
    expect(onSummon).not.toHaveBeenCalled()
  })

  it('with no rank unlocked it explains why, and cannot draw even with tickets', () => {
    const onSummon = mount(3, [])
    expect(screen.getByText(/Reach Lv.5 to unlock D-rank/)).toBeTruthy()
    expect(summonButton().disabled).toBe(true)
    expect(screen.queryByLabelText('Draw odds by rank')).toBeNull()
    fireEvent.click(summonButton())
    expect(onSummon).not.toHaveBeenCalled()
  })

  it('offers no way to buy tickets', () => {
    mount(0)
    expect(screen.queryByRole('button', { name: /buy|purchase|get tickets|shop/i })).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('SummonSheet — artwork', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('sits on the summoning-circle background', () => {
    mount(1)
    const bg = document.querySelector('img[src*="summon-circle"]')
    expect(bg).toBeTruthy()
    expect(screen.getByTestId('screen-background-overlay').dataset.tone).toBe('dark')
  })

  it.each(COMPANIONS.map((c) => [c.name, c] as const))(
    '%s: the reveal shows its own art, with its rank\'s colour behind it',
    (_name, companion) => {
      mount(1, [companion.rank], vi.fn(() => ({ companion, duplicate: false })))
      fireEvent.click(summonButton())
      // The roll comes first: no art yet.
      expect(screen.queryByTestId('summon-art')).toBeNull()
      act(() => void vi.advanceTimersByTime(1600))
      expect(screen.getByTestId('summon-art').getAttribute('src')).toMatch(
        new RegExp(`${companion.art}[^/]*\\.jpg`),
      )
      // The glow is per RANK, not per companion.
      const result = screen.getByTestId('summon-result')
      expect(result.dataset.rank).toBe(companion.rank)
      expect(result.className.split(' ')).toContain(`rank-${companion.rank.toLowerCase()}`)
      expect(result.querySelector('.rank-glow')).toBeTruthy()
      expect(within(result).getByText(companion.name, { exact: false })).toBeTruthy()
    },
  )

  it('a companion with no file of its own falls back to its rank image', () => {
    const ghost = { ...COMPANIONS.find((c) => c.rank === 'A')!, art: 'no-such-file' }
    mount(1, ['A'], vi.fn(() => ({ companion: ghost, duplicate: false })))
    fireEvent.click(summonButton())
    act(() => void vi.advanceTimersByTime(1600))
    expect(screen.getByTestId('summon-art').getAttribute('src')).toMatch(/companion-a[^/]*\.jpg/)
  })
})

describe('MonsterCompanionsGrid — summon entry point', () => {
  afterEach(cleanup)

  it('shows tickets and opens the Summon screen', () => {
    render(
      <MonsterCompanionsGrid level={12} unlockedMilestones={[5, 10]} tickets={tickets(1, 4)} onSummon={vi.fn(() => null)} />,
    )
    expect(screen.getByText('1 ticket')).toBeTruthy()
    expect(screen.getByText('Next in 1 claim')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Summon' }))
    expect(screen.getByRole('dialog', { name: 'Summon a companion' })).toBeTruthy()
  })

  it('a recruited companion replaces its "?" with its real card', () => {
    render(
      <MonsterCompanionsGrid
        level={12}
        unlockedMilestones={[5, 10]}
        recruited={[WOLF.id]}
        tickets={tickets(0)}
        onSummon={vi.fn(() => null)}
      />,
    )
    const d = within(screen.getByLabelText('D-rank companions, unlocked')).getAllByRole('listitem')
    expect(d.filter((c) => c.textContent?.includes('Grey Wolf'))).toHaveLength(1)
    expect(d.filter((c) => c.textContent?.includes('?'))).toHaveLength(3)
  })
})
