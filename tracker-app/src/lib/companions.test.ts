import { describe, expect, it } from 'vitest'
import { TIERS } from '../components/ui/tiers'
import {
  COMPANIONS,
  COMPANION_MILESTONES,
  COMPANION_RANKS,
  RANK_ACCESS_LEVEL,
  RANK_TIER,
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
  it('use only the existing 5-step tier scale, never getting cooler as rank rises', () => {
    const steps = COMPANION_RANKS.map((r) => TIERS.indexOf(RANK_TIER[r]))
    expect(steps.every((s) => s >= 0)).toBe(true)
    expect([...steps].sort((a, b) => a - b)).toEqual(steps)
    expect(RANK_TIER.D).toBe('bronze')
    expect(RANK_TIER.SS).toBe('red')
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
