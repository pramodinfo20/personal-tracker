import { useEffect, useRef, useState } from 'react'
import type { SummonResult } from '../../hooks/useHunter'
import { cn } from '../../lib/cn'
import { COMPANIONS, RANK_TIER, type CompanionRank } from '../../lib/companions'
import {
  CLAIMS_PER_TICKET,
  STREAK_TICKET_EVERY,
  claimsToNextTicket,
  formatChance,
  rankOdds,
  type TicketState,
} from '../../lib/lottery'
import { Badge, Button, ScreenBackground, TIER_CLASSES } from '../ui'

export interface SummonSheetProps {
  tickets: TicketState
  /** Ranks the hunter can draw from right now. */
  ranks: CompanionRank[]
  /** Spends a ticket and returns what was drawn (null if it couldn't). */
  onSummon: () => SummonResult | null
  onClose: () => void
  /** How long the roll runs before the reveal. Shortened in tests. */
  rollMs?: number
}

const ROLL_MS = 1500
const ROLL_TICK_MS = 90
const SS_RIM = 'ring-2 ring-tier-gold/70'

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = { kind: 'idle' } | { kind: 'rolling'; result: SummonResult } | { kind: 'revealed'; result: SummonResult }

// The Summon screen: spend one ticket, watch a short roll, see who answered.
// The draw itself has already happened (and been saved) by the time the
// roll starts — the animation only delays showing it.
export function SummonSheet({ tickets, ranks, onSummon, onClose, rollMs = ROLL_MS }: SummonSheetProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [rollIcon, setRollIcon] = useState('?')
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current.forEach((t) => window.clearInterval(t))
    },
    [],
  )

  const odds = rankOdds(ranks)
  const canSummon = tickets.tickets > 0 && ranks.length > 0 && phase.kind !== 'rolling'
  const toNext = claimsToNextTicket(tickets)

  const summon = () => {
    if (!canSummon) return
    const result = onSummon()
    if (!result) return
    const duration = prefersReducedMotion() ? 0 : rollMs
    if (duration === 0) {
      setPhase({ kind: 'revealed', result })
      return
    }
    setPhase({ kind: 'rolling', result })
    // Flicker through companions from the ranks in play while it rolls.
    const pool = COMPANIONS.filter((c) => ranks.includes(c.rank))
    const tick = window.setInterval(
      () => setRollIcon(pool[Math.floor(Math.random() * pool.length)].icon),
      ROLL_TICK_MS,
    )
    const done = window.setTimeout(() => {
      window.clearInterval(tick)
      setPhase({ kind: 'revealed', result })
    }, duration)
    timers.current.push(tick, done)
  }

  const revealed = phase.kind === 'revealed' ? phase.result : null
  const tier = revealed ? RANK_TIER[revealed.companion.rank] : null
  const t = tier ? TIER_CLASSES[tier] : null

  return (
    <ScreenBackground screen="gate" layout="overlay" className="z-40">
      <div className="flex h-full items-end justify-center" onClick={onClose}>
        <div
          role="dialog"
          aria-label="Summon a companion"
          className="hud-glass hud-glass-strong max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-b-0 p-5 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">🎟️ Summon</h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-2xl leading-none text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* The stage: idle "?", the roll, then the result. */}
          <div
            className="flex min-h-[15rem] flex-col items-center justify-center text-center"
            aria-live="polite"
          >
            {phase.kind === 'idle' && (
              <>
                <div className="hud-icon h-24 w-24 font-mono text-5xl font-black text-text-secondary">?</div>
                <p className="mt-4 text-sm text-text-secondary">
                  {ranks.length === 0
                    ? 'Reach Lv.5 to unlock D-rank companions before you can summon.'
                    : 'One ticket, one companion. Who answers the call?'}
                </p>
              </>
            )}

            {phase.kind === 'rolling' && (
              <>
                <div
                  className="hud-icon animate-glow-pulse h-24 w-24 text-5xl"
                  aria-hidden="true"
                  data-testid="summon-roll"
                >
                  {rollIcon}
                </div>
                <p className="mt-4 text-sm font-bold text-text-primary">Summoning…</p>
              </>
            )}

            {revealed && t && (
              <div
                key={revealed.companion.id + tickets.tickets}
                className="hud-enter flex flex-col items-center"
                data-testid="summon-result"
              >
                <Badge tier={tier!} className={cn(revealed.companion.rank === 'SS' && 'ring-1 ring-tier-gold/70')}>
                  {revealed.companion.rank}-rank
                </Badge>
                <div
                  className={cn(
                    'mt-3 flex h-32 w-28 flex-col items-center justify-center rounded-2xl border-2',
                    t.bg,
                    t.border,
                    revealed.companion.rank === 'SS' && SS_RIM,
                  )}
                >
                  <span className="text-5xl" aria-hidden="true">
                    {revealed.companion.icon}
                  </span>
                </div>
                <div className="mt-3 text-lg font-extrabold text-text-primary">{revealed.companion.name}</div>
                <p className={cn('mt-1 text-sm font-bold', revealed.duplicate ? 'text-text-secondary' : t.text)}>
                  {revealed.duplicate ? 'You already have this one.' : 'New companion recruited!'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
            <span>
              Tickets:{' '}
              <span className="font-mono text-sm font-bold text-text-primary" data-testid="ticket-count">
                {tickets.tickets}
              </span>
            </span>
            <span>
              Next ticket in {toNext} {toNext === 1 ? 'claim' : 'claims'}
            </span>
          </div>

          <Button type="button" onClick={summon} disabled={!canSummon} className="mt-3 w-full">
            {phase.kind === 'rolling'
              ? 'Summoning…'
              : tickets.tickets < 1
                ? 'No tickets'
                : revealed
                  ? 'Summon again (1 ticket)'
                  : 'Summon (1 ticket)'}
          </Button>

          {odds.length > 0 && (
            <div className="mt-5">
              <div className="mb-1.5 text-[11px] font-bold tracking-wide text-text-secondary uppercase">
                Your odds
              </div>
              <ul className="flex flex-wrap gap-1.5" aria-label="Draw odds by rank">
                {odds.map(({ rank, chance }) => (
                  <li key={rank}>
                    <Badge tier={RANK_TIER[rank]}>
                      {rank} {formatChance(chance)}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-text-muted">
                You only ever draw from ranks you've unlocked. Reaching a new rank adds it to the pool.
              </p>
            </div>
          )}

          <p className="mt-4 text-[11px] text-text-muted">
            Tickets are earned, never bought: one for every {CLAIMS_PER_TICKET} quest claims, plus a bonus
            each time your streak reaches a multiple of {STREAK_TICKET_EVERY} days.
          </p>
        </div>
      </div>
    </ScreenBackground>
  )
}
