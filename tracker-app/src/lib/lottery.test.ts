import { describe, expect, it } from 'vitest'
import { COMPANION_RANKS, accessibleRanks, type CompanionRank } from './companions'
import {
  CLAIMS_PER_TICKET,
  RANK_WEIGHT,
  STREAK_TICKET_EVERY,
  claimsToNextTicket,
  drawCompanion,
  formatChance,
  rankOdds,
  ticketState,
  ticketsAfterClaim,
  ticketsAfterUndo,
  type TicketState,
} from './lottery'
import { localDateKey } from './format'

// Deterministic RNG (mulberry32) so the distribution test never flakes.
const seeded = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const NOW = new Date('2026-10-04T12:00:00.000Z')
const TODAY = '2026-10-04'
const START: TicketState = ticketState({})
/** dailyXP with XP on each of the last `n` days up to today. */
const streakOf = (n: number): Record<string, number> =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => [localDateKey(new Date(2026, 9, 4 - i)), 20]),
  )
const claim = (s: TicketState, dailyXP = streakOf(1)) => ticketsAfterClaim(s, dailyXP, TODAY, NOW)
const claims = (n: number, s: TicketState = START, dailyXP = streakOf(1)) => {
  for (let i = 0; i < n; i++) s = claim(s, dailyXP)
  return s
}

describe('earning tickets from claims', () => {
  it('a save with no ticket fields starts at zero', () => {
    expect(START).toEqual({ tickets: 0, claimCount: 0, claimTicketsAwarded: 0, lastStreakTicketDate: undefined })
  })

  it('awards one ticket on every 5th claim, and none in between', () => {
    expect(CLAIMS_PER_TICKET).toBe(5)
    expect([1, 2, 3, 4, 5, 6, 9, 10, 15, 24, 25].map((n) => claims(n).tickets)).toEqual([
      0, 0, 0, 0, 1, 1, 1, 2, 3, 4, 5,
    ])
  })

  it('claim / undo / claim cannot earn the same ticket twice', () => {
    let s = claims(5)
    expect(s.tickets).toBe(1)
    for (let i = 0; i < 10; i++) s = claim(ticketsAfterUndo(s))
    expect(s.tickets).toBe(1)
    expect(s.claimCount).toBe(5)
    // ...and the next real ticket still comes at the 10th claim.
    expect(claims(4, s).tickets).toBe(1)
    expect(claims(5, s).tickets).toBe(2)
  })

  it('an undo takes a claim off the count but never a ticket already earned', () => {
    const s = ticketsAfterUndo(claims(5))
    expect(s).toMatchObject({ tickets: 1, claimCount: 4, claimTicketsAwarded: 1 })
    expect(ticketsAfterUndo(START).claimCount).toBe(0)
  })

  it('claimsToNextTicket counts down to the next ticket', () => {
    expect([0, 1, 4, 5, 7].map((n) => claimsToNextTicket(claims(n)))).toEqual([5, 4, 1, 5, 3])
    // After an undo at 5 claims the ticket is already awarded, so the next one is at 10.
    expect(claimsToNextTicket(ticketsAfterUndo(claims(5)))).toBe(6)
  })
})

describe('earning the streak bonus ticket', () => {
  it('awards a bonus ticket when the streak stands at 7', () => {
    expect(STREAK_TICKET_EVERY).toBe(7)
    expect(claim(START, streakOf(6)).tickets).toBe(0)
    const s = claim(START, streakOf(7))
    expect(s.tickets).toBe(1)
    expect(s.lastStreakTicketDate).toBe(TODAY)
  })

  it('only once per day, however many claims follow', () => {
    expect(claims(4, START, streakOf(7)).tickets).toBe(1)
  })

  it('again at 14 and 21, but not at 8 or 13', () => {
    expect([8, 13, 14, 20, 21, 28].map((n) => claim(START, streakOf(n)).tickets)).toEqual([0, 0, 1, 0, 1, 1])
  })

  it('stacks with a claim ticket earned on the same claim', () => {
    const s = claim(claims(4), streakOf(7))
    expect(s.tickets).toBe(2)
  })

  it('undo then re-claim on the bonus day does not award it again', () => {
    const s = claim(ticketsAfterUndo(claim(START, streakOf(7))), streakOf(7))
    expect(s.tickets).toBe(1)
  })

  it('no bonus with no streak', () => {
    expect(claim(START, {}).tickets).toBe(0)
  })
})

describe('rankOdds', () => {
  it('weights fall steeply from D to SS', () => {
    const w = COMPANION_RANKS.map((r) => RANK_WEIGHT[r])
    expect([...w].sort((a, b) => b - a)).toEqual(w)
    expect(new Set(w).size).toBe(w.length)
  })

  it('with every rank open, the chances are the weights and sum to 1', () => {
    const odds = rankOdds([...COMPANION_RANKS])
    expect(odds.map((o) => o.rank)).toEqual([...COMPANION_RANKS])
    expect(odds.map((o) => o.chance)).toEqual([0.6, 0.25, 0.1, 0.04, 0.009, 0.001])
    expect(odds.reduce((s, o) => s + o.chance, 0)).toBeCloseTo(1, 10)
  })

  it('covers only accessible ranks, renormalised', () => {
    const odds = rankOdds(['D', 'C'])
    expect(odds.map((o) => o.rank)).toEqual(['D', 'C'])
    expect(odds[0].chance).toBeCloseTo(600 / 850, 10)
    expect(odds[1].chance).toBeCloseTo(250 / 850, 10)
    expect(rankOdds(['D'])).toEqual([{ rank: 'D', chance: 1 }])
    expect(rankOdds([])).toEqual([])
  })
})

describe('drawCompanion', () => {
  it('returns null when no rank is unlocked', () => {
    expect(drawCompanion([])).toBeNull()
    expect(drawCompanion(accessibleRanks(1))).toBeNull()
  })

  it('NEVER draws a rank the hunter has not unlocked — at every access level', () => {
    const random = seeded(11)
    for (const level of [5, 10, 12, 20, 30, 49, 50, 99]) {
      const ranks = accessibleRanks(level)
      for (let i = 0; i < 4000; i++) {
        const drawn = drawCompanion(ranks, random)!
        expect(ranks).toContain(drawn.rank)
      }
    }
  })

  it('over many draws the rank distribution matches the intended weights', () => {
    const random = seeded(2026)
    const N = 200_000
    const counts = Object.fromEntries(COMPANION_RANKS.map((r) => [r, 0])) as Record<CompanionRank, number>
    for (let i = 0; i < N; i++) counts[drawCompanion([...COMPANION_RANKS], random)!.rank] += 1

    for (const { rank, chance } of rankOdds([...COMPANION_RANKS])) {
      const actual = counts[rank] / N
      // Within 5 standard deviations of the expected share (and never zero).
      const sd = Math.sqrt((chance * (1 - chance)) / N)
      expect(Math.abs(actual - chance), `${rank}: expected ${chance}, got ${actual}`).toBeLessThan(5 * sd)
      expect(counts[rank]).toBeGreaterThan(0)
    }
    // And the ordering the player feels: each rank rarer than the one below.
    const ordered = COMPANION_RANKS.map((r) => counts[r])
    expect([...ordered].sort((a, b) => b - a)).toEqual(ordered)
  })

  it('the distribution also holds for a partial pool (D/C/B only)', () => {
    const random = seeded(7)
    const N = 100_000
    const ranks: CompanionRank[] = ['D', 'C', 'B']
    const counts: Record<string, number> = { D: 0, C: 0, B: 0 }
    for (let i = 0; i < N; i++) counts[drawCompanion(ranks, random)!.rank] += 1
    for (const { rank, chance } of rankOdds(ranks)) {
      const sd = Math.sqrt((chance * (1 - chance)) / N)
      expect(Math.abs(counts[rank] / N - chance)).toBeLessThan(5 * sd)
    }
    expect(Object.keys(counts)).toEqual(['D', 'C', 'B'])
  })

  it('within a rank, every companion can be drawn and none dominates', () => {
    const random = seeded(99)
    const counts: Record<string, number> = {}
    for (let i = 0; i < 40_000; i++) {
      const c = drawCompanion(['D'], random)!
      counts[c.name] = (counts[c.name] ?? 0) + 1
    }
    expect(Object.keys(counts).sort()).toEqual(['Cave Bat', 'Grey Wolf', 'Marsh Slime', 'Stone Golem'])
    for (const n of Object.values(counts)) expect(Math.abs(n / 40_000 - 0.25)).toBeLessThan(0.02)
  })

  it('handles the edges of the random range', () => {
    expect(drawCompanion([...COMPANION_RANKS], () => 0)!.rank).toBe('D')
    expect(drawCompanion([...COMPANION_RANKS], () => 0.999999999)!.rank).toBe('SS')
  })
})

describe('formatChance', () => {
  it('reads naturally at every size', () => {
    expect(formatChance(0.6)).toBe('60%')
    expect(formatChance(600 / 850)).toBe('71%')
    expect(formatChance(0.04)).toBe('4%')
    expect(formatChance(0.009)).toBe('0.9%')
    expect(formatChance(0.001)).toBe('0.1%')
    expect(formatChance(0.0004)).toBe('<0.1%')
    expect(formatChance(1)).toBe('100%')
  })
})
