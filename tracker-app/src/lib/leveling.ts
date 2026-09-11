// Ported as-is from pramod-2026-tracker.html (HUNTER / LEVEL SYSTEM section).

export const xpForLevel = (lvl: number): number =>
  Math.round(60 * Math.pow(lvl, 1.3) + 40)

export interface XPGainResult {
  xp: number
  level: number
  statPoints: number
  gained: number
}

export const applyXPGain = (
  xp: number,
  level: number,
  statPoints: number,
  amount: number,
): XPGainResult => {
  let newXp = (xp || 0) + amount
  let newLevel = level || 1
  let newStatPoints = statPoints || 0
  let gained = 0
  let need = xpForLevel(newLevel)
  while (newXp >= need) {
    newXp -= need
    newLevel++
    gained++
    newStatPoints += 3
    need = xpForLevel(newLevel)
  }
  return { xp: newXp, level: newLevel, statPoints: newStatPoints, gained }
}
