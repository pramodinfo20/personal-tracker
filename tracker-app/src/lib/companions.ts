// Monster Companions (formerly "Shadow Army"): a graded roster — D, C, B, A,
// S, SS — where reaching a milestone level unlocks ACCESS to a rank, rather
// than handing over one fixed companion per milestone.
//
// This phase is rank access and the grid only. Recruiting (the draw) isn't
// built yet, so nothing writes Hunter.recruitedCompanions; the grid already
// knows how to show a recruited companion for when it is.
//
// Milestones reached are still recorded in Hunter.unlockedShadows — the
// field keeps its old name so existing saves and backups load unchanged —
// and the undo guard (lib/undoGuard.ts) still refuses an undo that would
// drop the hunter back below one.

export const COMPANION_RANKS = ['D', 'C', 'B', 'A', 'S', 'SS'] as const
export type CompanionRank = (typeof COMPANION_RANKS)[number]

/** The level milestones (unchanged from the Shadow Army's ten). */
export const COMPANION_MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100] as const

// Which milestone opens each rank. The gaps widen as the ranks get rarer:
// +5, +10, +10, +20, +50 levels. The four milestones in between (15, 25,
// 40, 75) open no new rank — they stay ordinary milestones for now.
export const RANK_ACCESS_LEVEL: Record<CompanionRank, number> = {
  D: 5,
  C: 10,
  B: 20,
  A: 30,
  S: 50,
  SS: 100,
}

// Each rank's colour, as a CSS class that sets --rank (index.css): grey,
// green, blue, violet, cyan, gold — D to SS. These follow the companion
// artwork (lib/companionArt.ts), so a card's colour and its art agree, and
// every rank has a colour of its own.
export const RANK_CLASS: Record<CompanionRank, string> = {
  D: 'rank-d',
  C: 'rank-c',
  B: 'rank-b',
  A: 'rank-a',
  S: 'rank-s',
  SS: 'rank-ss',
}

export interface Companion {
  id: string
  name: string
  rank: CompanionRank
  icon: string
  /**
   * File key of this companion's own image in src/assets/companions/
   * ("stone-golem" -> stone-golem.jpg). See lib/companionArt.ts.
   */
  art: string
}

const slug = (name: string, separator: string): string =>
  name.toLowerCase().replace(/[^a-z]+/g, separator)

// [name, icon, art?] — art defaults to the name as a file key.
const roster = (
  rank: CompanionRank,
  entries: [name: string, icon: string, art?: string][],
): Companion[] =>
  entries.map(([name, icon, art]) => ({
    id: `${rank.toLowerCase()}_${slug(name, '_')}`,
    name,
    rank,
    icon,
    art: art ?? slug(name, '-'),
  }))

export const COMPANIONS: Companion[] = [
  ...roster('D', [
    ['Stone Golem', '🗿'],
    ['Marsh Slime', '🫧'],
    // The original D-rank image is this wolf, so it keeps that file.
    ['Grey Wolf', '🐺', 'companion-d'],
    ['Cave Bat', '🦇'],
  ]),
  ...roster('C', [
    ['Flame Imp', '😈'],
    ['Ice Sprite', '❄️'],
    ['Iron Boar', '🐗'],
    ['Shadow Hound', '🐕'],
  ]),
  ...roster('B', [
    ['Thunder Hawk', '🦅'],
    ['Crystal Serpent', '🐍'],
    ['Storm Panther', '🐆'],
    ['Venom Wraith', '👻'],
  ]),
  ...roster('A', [
    ['Frost Wyvern', '🐲'],
    ['Obsidian Golem', '🪨'],
    ['Blaze Phoenix Chick', '🐤'],
    ['Abyss Kraken', '🦑'],
  ]),
  ...roster('S', [
    ['Radiant Griffin', '🦁'],
    ['Void Dragon', '🐉'],
    ['Celestial Tiger', '🐅'],
    ['Inferno Hydra', '🔥'],
  ]),
  ...roster('SS', [
    ['Astral Phoenix', '🌠'],
    ['Eclipse Dragon', '🌘'],
    ['Primordial Titan', '🏔️'],
  ]),
]

export const companionsOfRank = (rank: CompanionRank): Companion[] =>
  COMPANIONS.filter((c) => c.rank === rank)

/** The rank a milestone level opens, if any. */
export const rankUnlockedAt = (milestoneLevel: number): CompanionRank | null =>
  COMPANION_RANKS.find((r) => RANK_ACCESS_LEVEL[r] === milestoneLevel) ?? null

// A rank is accessible once its milestone has been reached — recorded in
// unlockedMilestones, or implied by the current level (a save whose level
// was set directly, e.g. the dev "jump").
export const hasRankAccess = (
  rank: CompanionRank,
  level: number,
  unlockedMilestones: number[] = [],
): boolean => {
  const needed = RANK_ACCESS_LEVEL[rank]
  return level >= needed || unlockedMilestones.includes(needed)
}

export const accessibleRanks = (level: number, unlockedMilestones: number[] = []): CompanionRank[] =>
  COMPANION_RANKS.filter((r) => hasRankAccess(r, level, unlockedMilestones))

/** The next rank still locked, lowest first — null once SS is open. */
export const nextLockedRank = (
  level: number,
  unlockedMilestones: number[] = [],
): CompanionRank | null =>
  COMPANION_RANKS.find((r) => !hasRankAccess(r, level, unlockedMilestones)) ?? null

// What reaching a milestone gave, in words — used by the undo guard's
// "this would undo …" message.
export const describeMilestone = (milestoneLevel: number): string => {
  const rank = rankUnlockedAt(milestoneLevel)
  return rank ? `${rank}-rank companion access (Lv.${milestoneLevel})` : `the Lv.${milestoneLevel} milestone`
}
