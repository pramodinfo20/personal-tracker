// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { COMPANIONS } from '../../lib/companions'
import { MonsterCompanionsGrid } from './MonsterCompanionsGrid'

const unlocked = (rank: string) => screen.queryByLabelText(`${rank}-rank companions, unlocked`)
const locked = (rank: string) => screen.queryByLabelText(`${rank}-rank companions, locked`)
const cards = (rank: string) => within(unlocked(rank)!).getAllByRole('listitem')

describe('MonsterCompanionsGrid', () => {
  afterEach(cleanup)

  it('is titled Monster Companions and no longer mentions shadows', () => {
    const { container } = render(<MonsterCompanionsGrid level={1} unlockedMilestones={[]} />)
    expect(screen.getByText('Monster Companions')).toBeTruthy()
    expect(screen.getByText(/Recruit a monster companion/)).toBeTruthy()
    expect(container.textContent).not.toMatch(/shadow/i)
  })

  it('a brand-new hunter: every rank locked, each saying what level opens it', () => {
    render(<MonsterCompanionsGrid level={1} unlockedMilestones={[]} />)
    const expected = { D: 5, C: 10, B: 20, A: 30, S: 50, SS: 100 }
    for (const [rank, level] of Object.entries(expected)) {
      expect(locked(rank)!.textContent).toContain(`${rank}-rank locked — reach Lv.${level}`)
      expect(unlocked(rank)).toBeNull()
    }
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText("Next: D-rank access at Lv.5 — you're Lv.1.")).toBeTruthy()
  })

  it('low level: D and C are open as "?" cards in their own colours; the rest stay locked', () => {
    render(<MonsterCompanionsGrid level={12} unlockedMilestones={[5, 10]} />)
    expect(cards('D')).toHaveLength(4)
    expect(cards('C')).toHaveLength(4)
    for (const card of [...cards('D'), ...cards('C')]) expect(card.textContent).toContain('?')
    expect(cards('D')[0].className).toContain('tier-bronze')
    expect(cards('C')[0].className).toContain('tier-silver')
    for (const rank of ['B', 'A', 'S', 'SS']) {
      expect(locked(rank)).toBeTruthy()
      expect(locked(rank)!.className).toContain('border-dashed')
    }
    expect(screen.getByText("Next: B-rank access at Lv.20 — you're Lv.12.")).toBeTruthy()
    expect(within(unlocked('D')!).getByText('0/4 recruited')).toBeTruthy()
  })

  it('high level reads differently: more ranks open, only SS still locked', () => {
    render(<MonsterCompanionsGrid level={60} unlockedMilestones={[5, 10, 15, 20, 25, 30, 40, 50]} />)
    for (const rank of ['D', 'C', 'B', 'A', 'S']) expect(unlocked(rank)).toBeTruthy()
    expect(cards('B')[0].className).toContain('tier-gold')
    expect(cards('A')[0].className).toContain('tier-purple')
    expect(cards('S')[0].className).toContain('tier-red')
    expect(locked('SS')!.textContent).toContain('SS-rank locked — reach Lv.100')
    expect(screen.getAllByRole('listitem')).toHaveLength(20)
  })

  it('level 100: everything open, SS marked out with a gold rim', () => {
    render(<MonsterCompanionsGrid level={100} unlockedMilestones={[]} />)
    expect(screen.queryByLabelText(/, locked$/)).toBeNull()
    expect(cards('SS')).toHaveLength(3)
    expect(cards('SS')[0].className).toContain('ring-tier-gold')
    expect(cards('S')[0].className).not.toContain('ring-tier-gold')
    expect(screen.getByText('Every rank is open to you.')).toBeTruthy()
  })

  it('a recruited companion shows its icon and name; the others in its rank stay "?"', () => {
    const wolf = COMPANIONS.find((c) => c.name === 'Grey Wolf')!
    render(<MonsterCompanionsGrid level={12} unlockedMilestones={[5, 10]} recruited={[wolf.id]} />)
    const d = cards('D')
    expect(d.filter((c) => c.textContent?.includes('Grey Wolf'))).toHaveLength(1)
    expect(d.filter((c) => c.textContent?.includes('?'))).toHaveLength(3)
    expect(within(unlocked('D')!).getByText('1/4 recruited')).toBeTruthy()
  })
})
