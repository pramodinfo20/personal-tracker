// Maps the original app's letter-tier gates and shadow "class" titles onto
// the 5-step bronze/silver/gold/purple/red rank-tier scale from the design
// system (src/index.css), so GateCard and ShadowArmyGrid can reuse Badge's
// tier coloring instead of inventing their own palette.

import { TIERS, type Tier } from '../ui'

export const gateTierColor = (tier: string): Tier => {
  switch (tier) {
    case 'E':
      return 'bronze'
    case 'D':
      return 'silver'
    case 'C':
      return 'gold'
    case 'B':
      return 'purple'
    default:
      // 'A' and 'S' — the two hardest gate ranks both read as the hottest tier.
      return 'red'
  }
}

export const rankTierColor = (rankName: string): Tier => {
  if (rankName.startsWith('E-Rank')) return 'bronze'
  if (rankName.startsWith('D-Rank')) return 'bronze'
  if (rankName.startsWith('C-Rank')) return 'silver'
  if (rankName.startsWith('B-Rank')) return 'silver'
  if (rankName.startsWith('A-Rank')) return 'gold'
  if (rankName.startsWith('S-Rank')) return 'purple'
  if (rankName === 'National Level Hunter') return 'purple'
  // Shadow Monarch — the final rank.
  return 'red'
}

export const shadowTierColor = (title: string): Tier => {
  if (title.startsWith('Beast')) return 'bronze'
  if (title.startsWith('Knight')) return 'silver'
  if (title.startsWith('Elite')) return 'gold'
  if (title.startsWith('Marshal')) return 'purple'
  // Monarch-class, Sovereign-class, and the final "???" title.
  return 'red'
}

// Purely cosmetic recognition badge for a stat that has grown past the base
// value of 10 — every 2 ten-point thresholds crossed escalates one step up
// the tier scale. No functional effect (see grantXP's automatic +1/action).
export const statMilestoneTier = (value: number): Tier | null => {
  const thresholdsCrossed = Math.floor((value - 10) / 10)
  if (thresholdsCrossed < 1) return null
  const index = Math.min(TIERS.length - 1, Math.floor((thresholdsCrossed - 1) / 2))
  return TIERS[index]
}
