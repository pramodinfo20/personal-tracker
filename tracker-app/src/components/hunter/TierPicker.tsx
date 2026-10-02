import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import type { XPTier } from '../../lib/quests'

export interface TierPickerProps {
  tiers: XPTier[]
  onPick: (tier: XPTier) => void
  disabled?: boolean
  /** Tier label -> XP currently celebrating (from useClaimCelebration), for the floating "+XP" on the tapped button. */
  celebrating?: Partial<Record<string, number>>
  className?: string
}

const CLAIM_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(255, 255, 255, 0.5)',
  '--pulse-ring-strong': 'rgba(255, 255, 255, 0.7)',
  '--pulse-glow': 'rgba(47, 143, 255, 0.5)',
  '--pulse-glow-strong': 'rgba(47, 143, 255, 0.9)',
} as CSSProperties

// The one tier picker for every {label, xp} tier list — daily quests and
// Log Activity both render this, so there's a single implementation of
// "pick how much you did, get that much XP". One tap on a tier is the claim.
export function TierPicker({ tiers, onPick, disabled, celebrating = {}, className }: TierPickerProps) {
  return (
    <div
      className={cn(
        'grid gap-2',
        tiers.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
        tiers.length === 4 && 'sm:grid-cols-4',
        className,
      )}
    >
      {tiers.map((tier) => {
        const isCelebrating = celebrating[tier.label] !== undefined
        return (
          <button
            key={tier.label}
            type="button"
            disabled={disabled}
            onClick={() => onPick(tier)}
            style={isCelebrating ? CLAIM_PULSE_STYLE : undefined}
            className={cn(
              'relative flex cursor-pointer flex-col items-center rounded-lg bg-accent px-2 py-2 text-white transition-all duration-150 active:scale-[0.97] hover:bg-accent-hover hover:shadow-glow-accent disabled:pointer-events-none disabled:opacity-40',
              isCelebrating && 'animate-claim-pulse',
            )}
          >
            <span className="text-sm font-semibold">{tier.label}</span>
            <span className="font-mono text-xs font-bold opacity-90">+{tier.xp} XP</span>
            {isCelebrating && (
              <span
                className="animate-float-up pointer-events-none absolute -top-2 right-2 font-mono text-sm font-black text-white"
                aria-hidden="true"
              >
                +{celebrating[tier.label]} XP
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
