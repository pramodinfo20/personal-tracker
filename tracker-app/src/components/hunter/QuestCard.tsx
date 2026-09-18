import type { CSSProperties } from 'react'
import type { CustomQuestTier } from '../../lib/customQuests'
import type { QuestArt } from '../../lib/questArt'
import { cn } from '../../lib/cn'

export type QuestCardClaim =
  | { kind: 'single'; xp: number; onClaim: () => void }
  | { kind: 'tiers'; tiers: CustomQuestTier[]; onClaim: (tier: CustomQuestTier) => void }

export interface QuestCardProps {
  art: QuestArt
  icon: string
  title: string
  subtitle: string
  done: boolean
  /** Shown instead of `subtitle` once done — e.g. "Hydration — 1L", the exact tier that was claimed. */
  doneLabel?: string
  isCelebrating: boolean
  celebratingXp?: number
  isConfirmingUndo: boolean
  blockedReason: string | null
  onUndoStart: () => void
  onUndoCancel: () => void
  onUndoConfirm: () => void
  claim: QuestCardClaim
}

const CLAIM_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(34, 197, 94, 0.5)',
  '--pulse-ring-strong': 'rgba(34, 197, 94, 0.7)',
  '--pulse-glow': 'rgba(34, 197, 94, 0.45)',
  '--pulse-glow-strong': 'rgba(34, 197, 94, 0.85)',
} as CSSProperties

// Shared visual for every Today-screen quest card — fixed and custom alike
// — so the two quest systems read as one, differentiated by category art
// (a tinted gradient + an oversized translucent glyph of the quest's own
// icon) rather than by two different card designs. Pure presentation only:
// claim/undo wiring, confirm state, and celebration timing all still live
// in the two callers (DailyQuestCards, CustomQuestCards).
export function QuestCard({
  art,
  icon,
  title,
  subtitle,
  done,
  doneLabel,
  isCelebrating,
  celebratingXp,
  isConfirmingUndo,
  blockedReason,
  onUndoStart,
  onUndoCancel,
  onUndoConfirm,
  claim,
}: QuestCardProps) {
  const artVars = {
    '--quest-color': art.color,
    '--quest-tint': art.tint,
    '--quest-border': art.border,
    '--quest-shadow': art.glowShadow,
  } as CSSProperties

  if (done) {
    return (
      <div
        style={isCelebrating ? { ...artVars, ...CLAIM_PULSE_STYLE } : artVars}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-success/25 bg-gradient-to-br from-success/[0.07] via-surface-2 to-surface-2 p-4 transition-all duration-150',
          isCelebrating && 'animate-claim-pulse',
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -bottom-5 text-8xl leading-none opacity-[0.07] grayscale select-none"
        >
          {icon}
        </span>
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-xl opacity-70 grayscale-[0.4]">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-text-secondary">{title}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[9px] font-bold tracking-wide text-success uppercase">
                ✓ Done
              </span>
            </div>
            {blockedReason ? (
              <span className="mt-0.5 block text-xs font-bold text-warning">{blockedReason}</span>
            ) : (
              <span className="mt-0.5 block truncate text-xs text-text-muted">{doneLabel ?? subtitle}</span>
            )}
          </div>
          <span className="shrink-0 text-right">
            {isConfirmingUndo ? (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onUndoCancel}
                  className="cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-bold text-text-muted hover:text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onUndoConfirm}
                  className="cursor-pointer rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning hover:bg-warning/20"
                >
                  Yes, undo
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={onUndoStart}
                className="cursor-pointer text-[10px] font-bold text-text-muted uppercase hover:text-warning"
              >
                Undo
              </button>
            )}
          </span>
        </div>
        {isCelebrating && (
          <span
            className="animate-float-up pointer-events-none absolute top-2 right-4 font-mono text-base font-black text-success"
            aria-hidden="true"
          >
            +{celebratingXp} XP
          </span>
        )}
      </div>
    )
  }

  const glyph = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-4 -bottom-6 text-9xl leading-none opacity-[0.16] transition-opacity duration-150 group-hover:opacity-[0.22] select-none"
    >
      {icon}
    </span>
  )

  const header = (
    <div className="relative flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--quest-border)] bg-[var(--quest-tint)] text-xl">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold tracking-wide text-[var(--quest-color)] uppercase">
          {art.label}
        </span>
        <span className="block text-sm font-bold text-text-primary">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-text-secondary">{subtitle}</span>
      </div>
      {claim.kind === 'single' && (
        <span className="shrink-0 text-right">
          <span className="block font-mono text-lg font-bold text-[var(--quest-color)]">+{claim.xp}</span>
          <span className="block text-[10px] font-bold text-text-muted uppercase">Tap to claim</span>
        </span>
      )}
    </div>
  )

  if (claim.kind === 'single') {
    return (
      <button
        type="button"
        onClick={claim.onClaim}
        style={artVars}
        className={cn(
          'group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-[var(--quest-border)]/50 p-4 text-left shadow-panel transition-all duration-150',
          'bg-gradient-to-br from-[var(--quest-tint)] via-surface to-surface-2',
          'active:scale-[0.98] hover:border-[var(--quest-color)] hover:shadow-[var(--quest-shadow)]',
        )}
      >
        {glyph}
        {header}
      </button>
    )
  }

  return (
    <div
      style={artVars}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-[var(--quest-border)]/50 p-4 shadow-panel transition-all duration-150',
        'bg-gradient-to-br from-[var(--quest-tint)] via-surface to-surface-2',
      )}
    >
      {glyph}
      {header}
      <div className="relative mt-3 flex flex-wrap gap-2">
        {claim.tiers.map((tier, i) => (
          <button
            key={`${tier.label}-${i}`}
            type="button"
            onClick={() => claim.onClaim(tier)}
            className="flex-[1_1_100px] cursor-pointer rounded-lg border border-[var(--quest-border)] bg-[var(--quest-tint)] px-3 py-2 text-center text-xs font-bold text-text-primary transition-all duration-150 active:scale-[0.97] hover:border-[var(--quest-color)] hover:bg-[var(--quest-color)]/20"
          >
            {tier.label} <span className="text-[var(--quest-color)]">+{tier.xp}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
