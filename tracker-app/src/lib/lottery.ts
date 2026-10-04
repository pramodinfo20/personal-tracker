// The companion lottery: how summon tickets are earned and how a draw picks
// a companion. Pure rules only — useHunter applies them to the save.
//
// Tickets are EARN-ONLY. They come from activity in the app and nothing
// else; there is deliberately no way to buy, gift or otherwise add one.

import {
  COMPANION_RANKS,
  accessibleRanks,
  companionsOfRank,
  type Companion,
  type CompanionRank,
} from './companions'
import type { Hunter } from './hunterState'
import { currentStreak } from './progress'

/** One ticket per this many quest claims (fixed, custom or logged activity). */
export const CLAIMS_PER_TICKET = 5
/** A bonus ticket whenever the streak is a multiple of this many days. */
export const STREAK_TICKET_EVERY = 7

// ── Earning ─────────────────────────────────────────────────────────────

export interface TicketState {
  tickets: number
  claimCount: number
  claimTicketsAwarded: number
  lastStreakTicketDate?: string
}

export const ticketState = (h: Partial<Hunter>): TicketState => ({
  tickets: h.tickets ?? 0,
  claimCount: h.claimCount ?? 0,
  claimTicketsAwarded: h.claimTicketsAwarded ?? 0,
  lastStreakTicketDate: h.lastStreakTicketDate,
})

// Ticket bookkeeping for one quest claim that has just landed. `dailyXP`
// is the map AFTER the claim and `todayKey` its UTC day.
//
// Claims: every CLAIMS_PER_TICKET-th claim earns a ticket. The number
// already awarded is remembered separately from the claim count, so undoing
// a claim and claiming again can't earn the same ticket twice.
//
// Streak: one bonus ticket on a day the streak stands at a multiple of
// STREAK_TICKET_EVERY (7, 14, 21 …), at most once per day.
export const ticketsAfterClaim = (
  state: TicketState,
  dailyXP: Record<string, number>,
  todayKey: string,
  now: Date = new Date(),
): TicketState => {
  const claimCount = state.claimCount + 1
  let { tickets, claimTicketsAwarded, lastStreakTicketDate } = state

  const dueFromClaims = Math.floor(claimCount / CLAIMS_PER_TICKET)
  if (dueFromClaims > claimTicketsAwarded) {
    tickets += dueFromClaims - claimTicketsAwarded
    claimTicketsAwarded = dueFromClaims
  }

  const streak = currentStreak(dailyXP, now)
  if (streak > 0 && streak % STREAK_TICKET_EVERY === 0 && lastStreakTicketDate !== todayKey) {
    tickets += 1
    lastStreakTicketDate = todayKey
  }

  return { tickets, claimCount, claimTicketsAwarded, lastStreakTicketDate }
}

// An undone claim stops counting toward the next ticket, but a ticket
// already earned (and maybe already spent) is never taken back.
export const ticketsAfterUndo = (state: TicketState): TicketState => ({
  ...state,
  claimCount: Math.max(0, state.claimCount - 1),
})

/** Claims still needed for the next claim-ticket (1..CLAIMS_PER_TICKET). */
export const claimsToNextTicket = (state: TicketState): number => {
  const nextAt = (Math.max(state.claimTicketsAwarded, Math.floor(state.claimCount / CLAIMS_PER_TICKET)) + 1) * CLAIMS_PER_TICKET
  return nextAt - state.claimCount
}

// ── Drawing ─────────────────────────────────────────────────────────────

// Relative weight of each rank when every rank is accessible: D common …
// SS extremely rare. Out of 1000, so they read as tenths of a percent.
export const RANK_WEIGHT: Record<CompanionRank, number> = {
  D: 600,
  C: 250,
  B: 100,
  A: 40,
  S: 9,
  SS: 1,
}

// The chance of each rank for this hunter: only ranks they have ACCESS to,
// with the weights of the locked ones redistributed proportionally. Sums
// to 1 (or is empty when no rank is unlocked yet).
export const rankOdds = (ranks: CompanionRank[]): { rank: CompanionRank; chance: number }[] => {
  const pool = COMPANION_RANKS.filter((r) => ranks.includes(r))
  const total = pool.reduce((sum, r) => sum + RANK_WEIGHT[r], 0)
  return pool.map((rank) => ({ rank, chance: RANK_WEIGHT[rank] / total }))
}

// One draw: a rank by weight from the accessible ranks, then a companion
// uniformly within that rank. `random` is injectable for tests. Returns
// null when no rank is accessible — never a companion from a locked rank.
export const drawCompanion = (
  ranks: CompanionRank[],
  random: () => number = Math.random,
): Companion | null => {
  const odds = rankOdds(ranks)
  if (odds.length === 0) return null
  let roll = random()
  let picked = odds[odds.length - 1].rank
  for (const { rank, chance } of odds) {
    if (roll < chance) {
      picked = rank
      break
    }
    roll -= chance
  }
  const pool = companionsOfRank(picked)
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}

/** The ranks this hunter can draw from. */
export const drawableRanks = (h: Pick<Hunter, 'level' | 'unlockedShadows'>): CompanionRank[] =>
  accessibleRanks(h.level || 1, h.unlockedShadows ?? [])

/** "60%", "0.9%", "<0.1%" */
export const formatChance = (chance: number): string => {
  const pct = chance * 100
  if (pct > 0 && pct < 0.1) return '<0.1%'
  return `${pct >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10}%`
}
