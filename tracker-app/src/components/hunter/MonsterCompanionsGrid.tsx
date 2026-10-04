import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { SummonResult } from '../../hooks/useHunter'
import { cn } from '../../lib/cn'
import {
  COMPANION_RANKS,
  RANK_ACCESS_LEVEL,
  RANK_TIER,
  accessibleRanks,
  companionsOfRank,
  hasRankAccess,
  nextLockedRank,
  type CompanionRank,
} from '../../lib/companions'
import { claimsToNextTicket, type TicketState } from '../../lib/lottery'
import { Badge, Button, Card, TIER_CLASSES } from '../ui'
import { SummonSheet } from './SummonSheet'

export interface MonsterCompanionsGridProps {
  level: number
  /** Milestone levels reached so far (Hunter.unlockedShadows). */
  unlockedMilestones: number[]
  /** Ids of companions recruited through the lottery. */
  recruited?: string[]
  /** Summon tickets and progress toward the next one. Omit (with onSummon) to hide summoning. */
  tickets?: TicketState
  /** Spend a ticket on a draw (useHunter's summon). */
  onSummon?: () => SummonResult | null
}

// SS shares S's colour (five tier colours, six ranks); a gold rim sets it apart.
const SS_RIM = 'ring-1 ring-tier-gold/70'

// The roster by rank, D to SS. Three clearly different states:
//   locked rank      — one dim, dashed strip: "B-RANK LOCKED — reach Lv.20"
//   accessible rank  — its cards in the rank's colour; a companion not yet
//                      recruited is a "?" card (there to be found)
//   recruited        — the companion's icon and name
// The Summon button opens the draw (SummonSheet), where tickets are spent.
export function MonsterCompanionsGrid({
  level,
  unlockedMilestones,
  recruited = [],
  tickets,
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

      {/* Portalled to <body> so the sheet covers the bottom tab bar. */}
      {summoning &&
        tickets &&
        onSummon &&
        createPortal(
          <SummonSheet
            tickets={tickets}
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
  const tier = RANK_TIER[rank]
  const t = TIER_CLASSES[tier]

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
    <section aria-label={`${rank}-rank companions, unlocked`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Badge tier={tier} className={cn(rank === 'SS' && SS_RIM)}>
          {rank}-rank
        </Badge>
        <span className="text-[11px] text-text-secondary">
          {found}/{companions.length} recruited
        </span>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {companions.map((c) => {
          const has = recruited.includes(c.id)
          return (
            <li
              key={c.id}
              title={has ? c.name : `An unrecruited ${rank}-rank companion`}
              className={cn(
                'flex aspect-[4/5] flex-col items-center justify-center rounded-xl border px-1 text-center',
                t.bg,
                t.border,
                rank === 'SS' && SS_RIM,
              )}
            >
              {has ? (
                <>
                  <span className="text-2xl" aria-hidden="true">
                    {c.icon}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[10px] leading-tight font-bold text-text-primary">
                    {c.name}
                  </span>
                </>
              ) : (
                <>
                  <span className={cn('font-mono text-2xl font-black', t.text)} aria-hidden="true">
                    ?
                  </span>
                  <span className="sr-only">Not recruited yet</span>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
