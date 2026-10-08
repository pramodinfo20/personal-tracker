import { useEffect, useRef, useState } from 'react'
import { useAndroidBackAction } from '../../hooks/useAndroidBackAction'
import type { SummonResult } from '../../hooks/useHunter'
import { cn } from '../../lib/cn'
import { companionArt } from '../../lib/companionArt'
import { COMPANIONS, RANK_CLASS, type CompanionRank } from '../../lib/companions'
import {
  CLAIMS_PER_TICKET,
  STREAK_TICKET_EVERY,
  claimsToNextTicket,
  formatChance,
  rankOdds,
  type TicketState,
} from '../../lib/lottery'
import { Button, ScreenBackground } from '../ui'

export interface SummonSheetProps {
  tickets: TicketState
  /** Duplicate-companion currency currently banked by the hunter. */
  echoShards?: number
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

// Text placed straight on the summoning-circle art: white with a dark halo,
// in both themes (the art is dark in both).
const ON_ART = 'text-on-art [text-shadow:0_1px_10px_rgb(0_0_0/0.9)]'

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = { kind: 'idle' } | { kind: 'rolling'; result: SummonResult } | { kind: 'revealed'; result: SummonResult }

// The Summon screen: full-screen over the summoning circle. The stage — the
// "?", the roll and the revealed companion — sits directly on the art; the
// tickets, button and odds are on a glass panel at the bottom. The draw has
// already happened (and been saved) by the time the roll starts; the
// animation only delays showing it.
export function SummonSheet({ tickets, echoShards = 0, ranks, onSummon, onClose, rollMs = ROLL_MS }: SummonSheetProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [rollIcon, setRollIcon] = useState('?')
  const timers = useRef<number[]>([])
  useAndroidBackAction(true, onClose, 200)

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
  const art = revealed ? companionArt(revealed.companion) : undefined

  return (
    <ScreenBackground screen="summon-circle" layout="overlay" className="z-40">
      <div role="dialog" aria-label="Summon a companion" className="flex h-full flex-col">
        <div className={cn('flex items-center justify-between px-5 pt-5', ON_ART)}>
          <h2 className="text-sm font-bold tracking-wide uppercase">🎟️ Summon</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-3xl leading-none opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* The stage: idle "?", the roll, then the companion — on the circle. */}
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center"
          aria-live="polite"
        >
          {phase.kind === 'idle' && (
            <>
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-full border border-on-art/40 bg-art-scrim/50 font-mono text-5xl font-black',
                  ON_ART,
                )}
              >
                ?
              </div>
              <p className={cn('mt-4 max-w-xs text-sm', ON_ART)}>
                {ranks.length === 0
                  ? 'Reach Lv.5 to unlock D-rank companions before you can summon.'
                  : 'One ticket, one companion. Who answers the call?'}
              </p>
            </>
          )}

          {phase.kind === 'rolling' && (
            <>
              <div
                className="animate-glow-pulse flex h-24 w-24 items-center justify-center rounded-full border border-on-art/50 bg-art-scrim/50 text-5xl"
                aria-hidden="true"
                data-testid="summon-roll"
              >
                {rollIcon}
              </div>
              <p className={cn('mt-4 text-sm font-bold', ON_ART)}>Summoning…</p>
            </>
          )}

          {revealed && (
            <div
              key={revealed.companion.id + tickets.tickets}
              className={cn('flex flex-col items-center', RANK_CLASS[revealed.companion.rank])}
              data-testid="summon-result"
              data-rank={revealed.companion.rank}
            >
              <span className="rank-surface-art intro-reveal rounded-full border px-3 py-0.5 text-xs font-bold tracking-wide uppercase">
                {revealed.companion.rank}-rank
              </span>
              {/* The hero: this companion's own artwork, fading and scaling
                  in with its RANK's colour glowing behind it. */}
              <div
                className="intro-reveal rank-glow relative mt-3 aspect-[3/4] w-44 overflow-hidden rounded-2xl border-2 bg-art-scrim"
                style={{ animationDelay: '120ms' }}
              >
                {art ? (
                  <img
                    src={art}
                    alt=""
                    draggable={false}
                    data-testid="summon-art"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden="true">
                    {revealed.companion.icon}
                  </span>
                )}
              </div>
              <div className={cn('mt-3 text-lg font-extrabold', ON_ART)}>
                <span aria-hidden="true">{revealed.companion.icon} </span>
                {revealed.companion.name}
              </div>
              <p
                className={cn(
                  'mt-0.5 text-sm font-bold [text-shadow:0_1px_10px_rgb(0_0_0/0.9)]',
                  revealed.duplicate ? 'text-on-art/80' : 'rank-text-art',
                )}
              >
                {revealed.duplicate
                  ? `Duplicate converted into +${revealed.echoShardsAwarded} Echo Shard.`
                  : 'New companion recruited!'}
              </p>
            </div>
          )}
        </div>

        {/* Controls: a SOLID panel in the app's own theme. Not glass — over
            art this dark, translucent light-theme glass turns grey and its
            text loses contrast. */}
        <div className="max-h-[45dvh] overflow-y-auto rounded-t-3xl border border-b-0 border-border-strong bg-bg-elevated p-5 pb-7 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
            <span>
              Tickets:{' '}
              <span className="font-mono text-sm font-bold text-text-primary" data-testid="ticket-count">
                {tickets.tickets}
              </span>
            </span>
            <span>
              Echo Shards:{' '}
              <span className="font-mono text-sm font-bold text-text-primary" data-testid="echo-shard-count">
                {echoShards}
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
            <div className="mt-4">
              <div className="mb-1.5 text-[11px] font-bold tracking-wide text-text-secondary uppercase">
                Your odds
              </div>
              <ul className="flex flex-wrap gap-1.5" aria-label="Draw odds by rank">
                {odds.map(({ rank, chance }) => (
                  <li
                    key={rank}
                    className={cn(
                      RANK_CLASS[rank],
                      'rank-surface rank-text rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase',
                    )}
                  >
                    {rank} {formatChance(chance)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-[11px] text-text-muted">
            You only ever draw from ranks you've unlocked. Tickets are earned, never bought: one for
            every {CLAIMS_PER_TICKET} quest claims, plus a bonus each time your streak reaches a
            multiple of {STREAK_TICKET_EVERY} days.
          </p>
        </div>
      </div>
    </ScreenBackground>
  )
}
