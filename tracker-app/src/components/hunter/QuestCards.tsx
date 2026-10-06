import { useEffect, useState, type CSSProperties } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { cn } from '../../lib/cn'
import { today } from '../../lib/format'
import { STAT_META, type LogEntry } from '../../lib/hunterState'
import {
  formatTierXPRange,
  questClaimEntry,
  type ClaimableQuest,
  type XPTier,
} from '../../lib/quests'
import { TierPicker } from './TierPicker'
import { glowClass, STAT_TIER } from './tierMapping'

export interface QuestCardsProps {
  /** Fixed DAILY_QUESTS, or active custom quests mapped through customQuestToClaimable. */
  quests: ClaimableQuest[]
  completedToday: Record<string, boolean>
  /** hunter.log — read to show which tier/XP each claimed-today quest was claimed at. */
  log: LogEntry[]
  xpToNextLevel?: number
  nextLevel?: number
  onClaim: (quest: ClaimableQuest, tier: XPTier) => void
  onUndo: (quest: ClaimableQuest) => UndoResult
  /** Where this list's entrance stagger starts (--i), so it cascades after whatever renders above it. */
  enterOffset?: number
}

const CLAIM_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgb(var(--rgb-success) / 0.5)',
  '--pulse-ring-strong': 'rgb(var(--rgb-success) / 0.7)',
  '--pulse-glow': 'rgb(var(--rgb-success) / 0.45)',
  '--pulse-glow-strong': 'rgb(var(--rgb-success) / 0.85)',
} as CSSProperties

// A confirm/message bubble auto-dismisses after this long if left untouched.
const AUTO_DISMISS_MS = 5000

// Renders fixed and custom quests alike — one card, one tier picker and
// one undo flow for every claimable quest.
// Each quest is its own big, whole-card tap target. A single-tier quest
// claims in exactly one tap; a multi-tier one expands into the shared
// TierPicker on tap, and picking a tier is the claim (still no separate
// confirmation step). A claim also triggers a
// brief floating "+XP" and a glow pulse right on the card that was tapped.
// A claimed-today card offers a small "Undo" — itself gated behind a
// lightweight inline confirm (a mistake-proofing feature skipping its own
// mistake-proofing would be ironic), not a full modal.
//
// Visuals: each card is a .hud-glass panel tinted by its stat's tier color
// (STAT_TIER -> .glow-*); claimed cards switch to the success tint. The
// staggered entrance (.hud-enter) lives on an outer wrapper whose classes
// never change — if it shared an element with animate-claim-pulse, the
// entrance would replay when the pulse class is removed after a claim.
export function QuestCards({
  quests,
  completedToday,
  log,
  xpToNextLevel,
  nextLevel,
  onClaim,
  onUndo,
  enterOffset = 0,
}: QuestCardsProps) {
  const { celebrating, celebrate } = useClaimCelebration<string>()
  const [pickingId, setPickingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<{ id: string; reason: string } | null>(null)

  useEffect(() => {
    if (!confirmingId) return
    const t = setTimeout(() => setConfirmingId(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [confirmingId])

  useEffect(() => {
    if (!blocked) return
    const t = setTimeout(() => setBlocked(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [blocked])

  const claim = (q: ClaimableQuest, tier: XPTier) => {
    setPickingId(null)
    onClaim(q, tier)
    celebrate(q.id, tier.xp)
  }

  const handleTap = (q: ClaimableQuest) => {
    if (q.tiers.length === 1) {
      claim(q, q.tiers[0])
      return
    }
    setPickingId((id) => (id === q.id ? null : q.id))
  }

  const startUndo = (id: string) => {
    setBlocked(null)
    setConfirmingId(id)
  }

  const confirmUndo = (q: ClaimableQuest) => {
    setConfirmingId(null)
    const result = onUndo(q)
    if (!result.ok) {
      setBlocked({ id: q.id, reason: result.reason ?? "Couldn't undo that." })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {quests.map((q, i) => {
        const done = !!completedToday?.[q.id]
        const sm = STAT_META.find((s) => s.key === q.stat)
        const isCelebrating = celebrating[q.id] !== undefined
        const isConfirming = confirmingId === q.id
        const blockedReason = blocked?.id === q.id ? blocked.reason : null

        const enterStyle = { '--i': enterOffset + i } as CSSProperties

        if (!done) {
          const isPicking = pickingId === q.id
          return (
            <div key={q.id} className="hud-enter" style={enterStyle}>
              <div
                className={cn(
                  'hud-glass hud-pressable rounded-2xl',
                  glowClass(STAT_TIER[q.stat]),
                  isPicking && 'border-[rgb(var(--glow)/0.75)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => handleTap(q)}
                  aria-expanded={q.tiers.length > 1 ? isPicking : undefined}
                  className="relative flex w-full cursor-pointer items-center gap-3 p-4 text-left"
                >
                  <span className="hud-icon h-12 w-12 text-[1.9rem] leading-none" aria-hidden="true">
                    {q.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text-primary">{q.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-text-secondary">
                      {q.hint} · {sm?.icon} {q.stat}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {/* Tier-colored XP range on its own dark chip (lightened a step
                        toward the text color — lighter in dark, darker in light): the tier colors can't hold contrast
                        over bright art through see-through glass on their own. */}
                    <span className="inline-block rounded-md bg-backing/50 px-1.5 font-mono text-lg font-bold text-[color-mix(in_srgb,rgb(var(--glow))_75%,var(--color-text-primary))] drop-shadow-[0_0_6px_rgb(var(--glow)/0.6)]">
                      {formatTierXPRange(q.tiers)}
                    </span>
                    <span className="block text-[10px] font-bold text-text-secondary uppercase">
                      {q.tiers.length === 1 ? 'Tap to claim' : isPicking ? 'Pick one' : 'Tap to pick'}
                    </span>
                  </span>
                </button>
                {isPicking && (
                  <div className="px-4 pb-4">
                    <TierPicker tiers={q.tiers} onPick={(tier) => claim(q, tier)} />
                    <button
                      type="button"
                      onClick={() => setPickingId(null)}
                      className="mt-2 w-full cursor-pointer text-center text-[10px] font-bold text-text-muted uppercase hover:text-text-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }

        // Old (pre-tier) claims have xp but no tier label — show just the XP.
        const entry = questClaimEntry(log, q.id, today())
        const statName = sm?.label ?? q.stat
        const claimedSummary = entry
          ? `+${entry.xp} XP${entry.tier ? ` · ${entry.tier}` : ''} · ${statName} +1${
              xpToNextLevel !== undefined && nextLevel ? ` · ${xpToNextLevel} to Lv.${nextLevel}` : ''
            }`
          : `${q.hint} · ${sm?.icon} ${q.stat}`

        return (
          <div key={q.id} className="hud-enter" style={enterStyle}>
            <div
              style={isCelebrating ? CLAIM_PULSE_STYLE : undefined}
              className={cn(
                // Same see-through glass; a stronger --glow tint marks it done.
              'hud-glass glow-success relative flex w-full items-center gap-3 rounded-2xl p-4 text-left [--hud-tint:0.2]',
                isCelebrating && 'animate-claim-pulse',
              )}
            >
              <span className="hud-icon h-12 w-12 text-[1.9rem] leading-none" aria-hidden="true">
                {q.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text-primary">{q.label}</span>
                {blockedReason ? (
                  <span className="mt-0.5 block text-xs font-bold text-warning">{blockedReason}</span>
                ) : (
                  <span className="mt-0.5 block text-xs text-text-secondary">
                    {claimedSummary}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                {isConfirming ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-bold text-text-muted hover:text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmUndo(q)}
                      className="cursor-pointer rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning hover:bg-warning/20"
                    >
                      Yes, undo
                    </button>
                  </span>
                ) : (
                  <>
                    <span className="block font-mono text-lg font-bold text-success">✓</span>
                    <button
                      type="button"
                      onClick={() => startUndo(q.id)}
                      className="cursor-pointer text-[10px] font-bold text-text-secondary uppercase hover:text-warning"
                    >
                      Undo
                    </button>
                  </>
                )}
              </span>
              {isCelebrating && (
                <span
                  className="animate-float-up pointer-events-none absolute top-2 right-4 font-mono text-base font-black text-success"
                  aria-hidden="true"
                >
                  +{celebrating[q.id]} XP
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
