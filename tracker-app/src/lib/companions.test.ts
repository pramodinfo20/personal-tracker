import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { COMPANION_ART_FILES, companionArt, hasOwnArt, rankArt, rankArtKey } from './companionArt'
import {
  COMPANIONS,
  COMPANION_MILESTONES,
  COMPANION_RANKS,
  RANK_ACCESS_LEVEL,
  RANK_CLASS,
  accessibleRanks,
  companionsOfRank,
  describeMilestone,
  hasRankAccess,
  nextLockedRank,
  rankUnlockedAt,
} from './companions'

describe('milestones', () => {
  it('are the same ten levels as before, ascending', () => {
    expect([...COMPANION_MILESTONES]).toEqual([5, 10, 15, 20, 25, 30, 40, 50, 75, 100])
  })
})

describe('roster', () => {
  it('has the starter companions under each rank, D to SS', () => {
    const names = (rank: (typeof COMPANION_RANKS)[number]) => companionsOfRank(rank).map((c) => c.name)
    expect(names('D')).toEqual(['Stone Golem', 'Marsh Slime', 'Grey Wolf', 'Cave Bat'])
    expect(names('C')).toEqual(['Flame Imp', 'Ice Sprite', 'Iron Boar', 'Shadow Hound'])
    expect(names('B')).toEqual(['Thunder Hawk', 'Crystal Serpent', 'Storm Panther', 'Venom Wraith'])
    expect(names('A')).toEqual(['Frost Wyvern', 'Obsidian Golem', 'Blaze Phoenix Chick', 'Abyss Kraken'])
    expect(names('S')).toEqual(['Radiant Griffin', 'Void Dragon', 'Celestial Tiger', 'Inferno Hydra'])
    expect(names('SS')).toEqual(['Astral Phoenix', 'Eclipse Dragon', 'Primordial Titan'])
    expect(COMPANIONS).toHaveLength(23)
  })

  it('every companion has a unique id and an icon', () => {
    expect(new Set(COMPANIONS.map((c) => c.id)).size).toBe(COMPANIONS.length)
    for (const c of COMPANIONS) {
      expect(c.icon.length).toBeGreaterThan(0)
      expect(c.id).toMatch(/^[a-z]+_[a-z_]+$/)
    }
  })
})

describe('rank colours', () => {
  const css = readFileSync('src/index.css', 'utf8')

  it('every rank has a colour class of its own', () => {
    const classes = COMPANION_RANKS.map((r) => RANK_CLASS[r])
    expect(classes).toEqual(['rank-d', 'rank-c', 'rank-b', 'rank-a', 'rank-s', 'rank-ss'])
    expect(new Set(classes).size).toBe(6)
  })

  it('each class is defined in the stylesheet, with a light-theme text colour too', () => {
    for (const rank of COMPANION_RANKS) {
      const key = rank.toLowerCase()
      expect(css).toContain(`.rank-${key} {`)
      expect(css).toContain(`--fixed-rank-${key}:`)
      // Once as the dark default, once overridden for light.
      expect(css.match(new RegExp(`--rgb-rank-${key}:`, 'g'))).toHaveLength(2)
    }
  })
})

describe('companion artwork', () => {
  const file = (url: string | undefined) => url?.split('/').pop()?.split('?')[0] ?? ''

  it('every companion has an image of its OWN — none relies on the rank fallback', () => {
    for (const c of COMPANIONS) {
      expect(hasOwnArt(c), `${c.name} is missing ${c.art}.jpg`).toBe(true)
      expect(file(companionArt(c))).toMatch(new RegExp(`^${c.art}[^/]*\\.jpg$`))
    }
  })

  it('all 23 images are different files', () => {
    expect(new Set(COMPANIONS.map((c) => companionArt(c))).size).toBe(23)
  })

  it('art keys are the companion names as file names; the Grey Wolf keeps the original D-rank wolf', () => {
    const key = (name: string) => COMPANIONS.find((c) => c.name === name)!.art
    expect(key('Stone Golem')).toBe('stone-golem')
    expect(key('Blaze Phoenix Chick')).toBe('blaze-phoenix-chick')
    expect(key('Primordial Titan')).toBe('primordial-titan')
    expect(key('Grey Wolf')).toBe('companion-d')
    expect(new Set(COMPANIONS.map((c) => c.art)).size).toBe(23)
  })

  it('the folder holds exactly those images plus the six rank fallbacks — nothing stray or misnamed', () => {
    const expected = new Set([...COMPANIONS.map((c) => c.art), ...COMPANION_RANKS.map(rankArtKey)])
    expect([...COMPANION_ART_FILES].sort()).toEqual([...expected].sort())
    expect(expected.size).toBe(28)
  })

  it('a companion whose own file is missing falls back to its rank image', () => {
    for (const rank of COMPANION_RANKS) {
      const ghost = { art: 'no-such-file', rank }
      expect(hasOwnArt(ghost)).toBe(false)
      expect(companionArt(ghost)).toBe(rankArt(rank))
      expect(file(rankArt(rank))).toMatch(new RegExp(`^companion-${rank.toLowerCase()}[^/]*\\.jpg$`))
    }
  })
})

describe('rank access', () => {
  it('each rank opens at one of the existing milestones, later for rarer ranks', () => {
    const levels = COMPANION_RANKS.map((r) => RANK_ACCESS_LEVEL[r])
    expect(levels).toEqual([5, 10, 20, 30, 50, 100])
    for (const level of levels) expect(COMPANION_MILESTONES).toContain(level)
  })

  it('the gaps between ranks never shrink — a curve, not one rank per milestone', () => {
    const levels = COMPANION_RANKS.map((r) => RANK_ACCESS_LEVEL[r])
    const gaps = levels.slice(1).map((l, i) => l - levels[i])
    expect([...gaps].sort((a, b) => a - b)).toEqual(gaps)
    expect(new Set(gaps).size).toBeGreaterThan(1)
  })

  it('a new hunter has no rank yet; D opens at 5 and C at 10', () => {
    expect(accessibleRanks(1)).toEqual([])
    expect(accessibleRanks(4)).toEqual([])
    expect(accessibleRanks(5)).toEqual(['D'])
    expect(accessibleRanks(12)).toEqual(['D', 'C'])
  })

  it('mid levels open B and A, late levels S and SS', () => {
    expect(accessibleRanks(20)).toEqual(['D', 'C', 'B'])
    expect(accessibleRanks(45)).toEqual(['D', 'C', 'B', 'A'])
    expect(accessibleRanks(50)).toEqual(['D', 'C', 'B', 'A', 'S'])
    expect(accessibleRanks(99)).toEqual(['D', 'C', 'B', 'A', 'S'])
    expect(accessibleRanks(100)).toEqual([...COMPANION_RANKS])
  })

  it('a recorded milestone keeps its rank open even if the level reads lower', () => {
    expect(hasRankAccess('C', 9, [5, 10])).toBe(true)
    expect(hasRankAccess('B', 9, [5, 10])).toBe(false)
  })

  it('nextLockedRank is the lowest rank still locked', () => {
    expect(nextLockedRank(1)).toBe('D')
    expect(nextLockedRank(12)).toBe('B')
    expect(nextLockedRank(60)).toBe('SS')
    expect(nextLockedRank(100)).toBeNull()
  })

  it('rankUnlockedAt / describeMilestone', () => {
    expect(rankUnlockedAt(20)).toBe('B')
    expect(rankUnlockedAt(15)).toBeNull()
    expect(describeMilestone(5)).toBe('D-rank companion access (Lv.5)')
    expect(describeMilestone(15)).toBe('the Lv.15 milestone')
  })
})
