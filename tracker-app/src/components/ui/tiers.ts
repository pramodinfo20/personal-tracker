// Shared rank-tier color scale: bronze -> silver -> gold -> purple -> red.
// Maps each tier to the Tailwind utility classes that back it (see the
// --color-tier-* and --shadow-glow-* tokens in src/index.css).

export type Tier = 'bronze' | 'silver' | 'gold' | 'purple' | 'red'

export const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'purple', 'red']

interface TierClasses {
  text: string
  bg: string
  border: string
  glow: string
}

export const TIER_CLASSES: Record<Tier, TierClasses> = {
  bronze: {
    text: 'text-tier-bronze',
    bg: 'bg-tier-bronze/15',
    border: 'border-tier-bronze/50',
    glow: 'hover:shadow-glow-bronze',
  },
  silver: {
    text: 'text-tier-silver',
    bg: 'bg-tier-silver/15',
    border: 'border-tier-silver/50',
    glow: 'hover:shadow-glow-silver',
  },
  gold: {
    text: 'text-tier-gold',
    bg: 'bg-tier-gold/15',
    border: 'border-tier-gold/50',
    glow: 'hover:shadow-glow-gold',
  },
  purple: {
    text: 'text-tier-purple',
    bg: 'bg-tier-purple/15',
    border: 'border-tier-purple/50',
    glow: 'hover:shadow-glow-purple',
  },
  red: {
    text: 'text-tier-red',
    bg: 'bg-tier-red/15',
    border: 'border-tier-red/50',
    glow: 'hover:shadow-glow-red',
  },
}
