import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { SummonResult } from '../../hooks/useHunter'
import { cn } from '../../lib/cn'
import { companionArt } from '../../lib/companionArt'
import {
  COMPANION_RANKS,
  RANK_ACCESS_LEVEL,
  RANK_CLASS,
  accessibleRanks,
  companionsOfRank,
  hasRankAccess,
  nextLockedRank,
  type Companion,
  type CompanionRank,
} from '../../lib/companions'
import { claimsToNextTicket, type TicketState } from '../../lib/lottery'
import { Button, Card } from '../ui'
import { SummonSheet } from './SummonSheet'

export interface MonsterCompanionsGridProps {
  level: number
  /** Milestone levels reached so far (Hunter.unlockedShadows). */
  unlockedMilestones: number[]
  /** Ids of companions recruited through the lottery. */
  recruited?: string[]
  /** Summon tickets and progress toward the next one. Omit (with onSummon) to hide summoning. */
  tickets?: TicketState
  /** Duplicate-companion currency currently banked by the hunter. */
  echoShards?: number
  /** Spend a ticket on a draw (useHunter's summon). */
  onSummon?: () => SummonResult | null
}

// The roster by rank, D to SS. Three clearly different states:
//   locked rank      — one dim, dashed strip: "B-RANK LOCKED — reach Lv.20"
//   accessible rank  — its cards in the rank's colour; a companion not yet
//                      recruited is a "?" card (there to be found)
//   recruited        — the companion's own artwork, with its name
// The Summon button opens the draw (SummonSheet), where tickets are spent.
export function MonsterCompanionsGrid({
  level,
  unlockedMilestones,
  recruited = [],
  tickets,
  echoShards = 0,
  onSummon,
}: MonsterCompanionsGridProps) {
  const [summoning, setSummoning] = useState(false)
  const next = nextLockedRank(level, unlockedMilestones)
  const toNext = tickets ? claimsToNextTicket(tickets) : 0

  return (
    <Card title="Monster Companions" icon="🐾">
      <p className="mb-1 text-xs text-text-secondary">
        Recruit a monster companion as you level up. Milestone levels unlock access to rarer ranks.
      </p>
      <p className="mb-4 text-xs font-bold text-text-primary">
        {next
          ? `Next: ${next}-rank access at Lv.${RANK_ACCESS_LEVEL[next]} — you're Lv.${level}.`
          : 'Every rank is open to you.'}
      </p>

      {tickets && onSummon && (
        <div className="hud-inset mb-4 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary">
              <span aria-hidden="true">🎟️ </span>
              {tickets.tickets} {tickets.tickets === 1 ? 'ticket' : 'tickets'}
            </div>
            <div className="text-[11px] text-text-secondary">
              Next in {toNext} {toNext === 1 ? 'claim' : 'claims'}
            </div>
            <div className="text-[11px] font-bold text-text-primary">
              Echo Shards: <span data-testid="echo-shards-total">{echoShards}</span>
            </div>
          </div>
          <Button type="button" onClick={() => setSummoning(true)} className="shrink-0">
            Summon
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {COMPANION_RANKS.map((rank) => (
          <RankRow
            key={rank}
            rank={rank}
            accessible={hasRankAccess(rank, level, unlockedMilestones)}
            recruited={recruited}
          />
        ))}
      </div>

      {/* Portalled to <body> so the summon screen covers the bottom tab bar. */}
      {summoning &&
        tickets &&
        onSummon &&
        createPortal(
          <SummonSheet
            tickets={tickets}
            echoShards={echoShards}
            ranks={accessibleRanks(level, unlockedMilestones)}
            onSummon={onSummon}
            onClose={() => setSummoning(false)}
          />,
          document.body,
        )}
    </Card>
  )
}

interface RankRowProps {
  rank: CompanionRank
  accessible: boolean
  recruited: string[]
}

function RankRow({ rank, accessible, recruited }: RankRowProps) {
  const companions = companionsOfRank(rank)

  if (!accessible) {
    return (
      <section
        aria-label={`${rank}-rank companions, locked`}
        className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-track px-3 py-2.5"
      >
        <span className="text-xs font-bold tracking-wide text-text-muted uppercase">
          <span aria-hidden="true">🔒 </span>
          {rank}-rank locked — reach Lv.{RANK_ACCESS_LEVEL[rank]}
        </span>
        <span className="flex shrink-0 gap-1" aria-hidden="true">
          {companions.map((c) => (
            <span key={c.id} className="h-2 w-2 rounded-full bg-border-strong" />
          ))}
        </span>
      </section>
    )
  }

  const found = companions.filter((c) => recruited.includes(c.id)).length
  return (
    <section aria-label={`${rank}-rank companions, unlocked`} className={RANK_CLASS[rank]}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="rank-surface rank-text inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase">
          {rank}-rank
        </span>
        <span className="text-[11px] text-text-secondary">
          {found}/{companions.length} recruited
        </span>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {companions.map((c) =>
          recruited.includes(c.id) ? <RecruitedCard key={c.id} companion={c} /> : <UnknownCard key={c.id} rank={rank} id={c.id} />,
        )}
      </ul>
    </section>
  )
}

const CARD = 'relative aspect-[3/4] overflow-hidden rounded-xl border'

// Not recruited yet: a "?" in the rank's colour — there to be found.
function UnknownCard({ rank, id }: { rank: CompanionRank; id: string }) {
  return (
    <li
      data-companion={id}
      title={`An unrecruited ${rank}-rank companion`}
      className={cn(CARD, 'rank-surface flex items-center justify-center')}
    >
      <span className="rank-text font-mono text-2xl font-black" aria-hidden="true">
        ?
      </span>
      <span className="sr-only">Not recruited yet</span>
    </li>
  )
}

// Recruited: the companion's own artwork fills the card, with its name on a
// dark band at the bottom. If the art is missing, the icon stands in.
function RecruitedCard({ companion }: { companion: Companion }) {
  const art = companionArt(companion)
  return (
    <li
      data-companion={companion.id}
      title={companion.name}
      className={cn(CARD, 'border-[rgb(var(--rank)/0.8)] bg-art-scrim')}
    >
      {art ? (
        <img
          src={art}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-2xl" aria-hidden="true">
          {companion.icon}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-art-scrim/90 via-art-scrim/70 to-transparent px-1 pt-4 pb-1 text-center text-[10px] leading-tight font-bold text-on-art">
        <span className="line-clamp-3">{companion.name}</span>
      </span>
    </li>
  )
}
