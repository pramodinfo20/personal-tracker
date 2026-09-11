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

export interface RankInfo {
  min: number
  name: string
  color: string
  emoji: string
}

export const RANKS: RankInfo[] = [
  { min: 1, name: 'E-Rank Hunter', color: '#9ca3af', emoji: '🔰' },
  { min: 5, name: 'D-Rank Hunter', color: '#22c55e', emoji: '🟢' },
  { min: 10, name: 'C-Rank Hunter', color: '#3b82f6', emoji: '🔵' },
  { min: 15, name: 'B-Rank Hunter', color: '#8b5cf6', emoji: '🟣' },
  { min: 20, name: 'A-Rank Hunter', color: '#f59e0b', emoji: '🟠' },
  { min: 30, name: 'S-Rank Hunter', color: '#ef4444', emoji: '🔴' },
  { min: 50, name: 'National Level Hunter', color: '#facc15', emoji: '👑' },
  { min: 100, name: 'Shadow Monarch', color: '#a78bfa', emoji: '🖤' },
]

export const rankForLevel = (lvl: number): RankInfo =>
  [...RANKS].reverse().find((r) => lvl >= r.min) ?? RANKS[0]
