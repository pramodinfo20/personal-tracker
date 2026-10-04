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
    expect(unlocked('D')!.className).toContain('rank-d')
    expect(unlocked('C')!.className).toContain('rank-c')
    expect(cards('D')[0].className).toContain('rank-surface')
    expect(cards('D')[0].querySelector('img')).toBeNull()
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
    expect(unlocked('B')!.className).toContain('rank-b')
    expect(unlocked('A')!.className).toContain('rank-a')
    expect(unlocked('S')!.className).toContain('rank-s')
    expect(locked('SS')!.textContent).toContain('SS-rank locked — reach Lv.100')
    expect(screen.getAllByRole('listitem')).toHaveLength(20)
  })

  it('level 100: everything open, SS in its own colour', () => {
    render(<MonsterCompanionsGrid level={100} unlockedMilestones={[]} />)
    expect(screen.queryByLabelText(/, locked$/)).toBeNull()
    expect(cards('SS')).toHaveLength(3)
    expect(unlocked('SS')!.className).toContain('rank-ss')
    expect(unlocked('S')!.className).not.toContain('rank-ss')
    expect(screen.getByText('Every rank is open to you.')).toBeTruthy()
  })

  it('a recruited companion shows its rank art and name; the others in its rank stay "?"', () => {
    const wolf = COMPANIONS.find((c) => c.name === 'Grey Wolf')!
    render(<MonsterCompanionsGrid level={12} unlockedMilestones={[5, 10]} recruited={[wolf.id]} />)
    const d = cards('D')
    const wolfCard = d.filter((c) => c.textContent?.includes('Grey Wolf'))
    expect(wolfCard).toHaveLength(1)
    expect(wolfCard[0].querySelector('img')?.getAttribute('src')).toMatch(/companion-d[^/]*\.jpg/)
    expect(wolfCard[0].textContent).not.toContain('?')
    const unknown = d.filter((c) => c.textContent?.includes('?'))
    expect(unknown).toHaveLength(3)
    for (const card of unknown) expect(card.querySelector('img')).toBeNull()
    expect(within(unlocked('D')!).getByText('1/4 recruited')).toBeTruthy()
  })

  it('every recruited companion shows its OWN art — 23 different images', () => {
    render(<MonsterCompanionsGrid level={100} unlockedMilestones={[]} recruited={COMPANIONS.map((c) => c.id)} />)
    const shown = COMPANIONS.map((c) => {
      const src = document.querySelector(`[data-companion="${c.id}"] img`)?.getAttribute('src') ?? ''
      expect(src, c.name).toMatch(new RegExp(`${c.art}[^/]*\\.jpg`))
      return src
    })
    expect(new Set(shown).size).toBe(23)
    expect(screen.queryByText('?')).toBeNull()
  })

  it('two companions of the same rank show different art', () => {
    const [golem, slime] = COMPANIONS.filter((c) => c.rank === 'D')
    render(<MonsterCompanionsGrid level={12} unlockedMilestones={[5, 10]} recruited={[golem.id, slime.id]} />)
    const src = (id: string) => document.querySelector(`[data-companion="${id}"] img`)!.getAttribute('src')
    expect(src(golem.id)).toMatch(/stone-golem/)
    expect(src(slime.id)).toMatch(/marsh-slime/)
  })
})
