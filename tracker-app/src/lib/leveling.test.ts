import { describe, expect, it } from 'vitest'
import { applyXPGain, rankForLevel, reverseXPGain, xpForLevel } from './leveling'

describe('xpForLevel', () => {
  it('matches the original formula output at known levels', () => {
    expect(xpForLevel(1)).toBe(100)
    expect(xpForLevel(2)).toBe(188)
    expect(xpForLevel(5)).toBe(526)
    expect(xpForLevel(10)).toBe(1237)
  })
})

describe('applyXPGain', () => {
  it('gains XP without leveling up when below the threshold', () => {
    expect(applyXPGain(0, 1, 0, 50)).toEqual({
      xp: 50,
      level: 1,
      statPoints: 0,
      gained: 0,
    })
  })

  it('levels up once, carrying over remainder XP and +3 stat points', () => {
    expect(applyXPGain(0, 1, 0, 150)).toEqual({
      xp: 50,
      level: 2,
      statPoints: 3,
      gained: 1,
    })
  })

  it('levels up from existing xp/statPoints, not just from zero', () => {
    expect(applyXPGain(90, 1, 0, 15)).toEqual({
      xp: 5,
      level: 2,
      statPoints: 3,
      gained: 1,
    })
  })

  it('handles multi-level gains in a single grant', () => {
    expect(applyXPGain(0, 1, 0, 1000)).toEqual({
      xp: 18,
      level: 5,
      statPoints: 12,
      gained: 4,
    })
  })
})

describe('reverseXPGain', () => {
  it('subtracts xp without dropping a level when enough xp remains', () => {
    expect(reverseXPGain(50, 3, 6, 20)).toEqual({
      xp: 30,
      level: 3,
      statPoints: 6,
      lost: 0,
    })
  })

  it('drops exactly one level, restoring the lower level’s xp bucket and -3 stat points', () => {
    // Mirrors applyXPGain(0, 1, 0, 150) -> {xp:50, level:2, statPoints:3, gained:1}
    expect(reverseXPGain(50, 2, 3, 150)).toEqual({
      xp: 0,
      level: 1,
      statPoints: 0,
      lost: 1,
    })
  })

  it('drops multiple levels in a single reversal, mirroring applyXPGain’s multi-level-up loop', () => {
    expect(reverseXPGain(50, 3, 6, 288)).toEqual({
      xp: 50,
      level: 1,
      statPoints: 0,
      lost: 2,
    })
  })

  it('is the exact inverse of applyXPGain for single-level, multi-level, and non-zero-start gains', () => {
    const cases: Array<[number, number, number, number]> = [
      [0, 1, 0, 150], // single level up
      [0, 1, 0, 1000], // multi-level up (4 levels)
      [90, 1, 0, 15], // non-zero starting xp
    ]
    for (const [xp, level, statPoints, amount] of cases) {
      const forward = applyXPGain(xp, level, statPoints, amount)
      const reversed = reverseXPGain(forward.xp, forward.level, forward.statPoints, amount)
      expect(reversed).toEqual({ xp, level, statPoints, lost: forward.gained })
    }
  })

  it('floors at level 1 / 0 xp instead of going negative when amount exceeds everything banked', () => {
    expect(reverseXPGain(10, 1, 0, 500)).toEqual({
      xp: 0,
      level: 1,
      statPoints: 0,
      lost: 0,
    })
  })

  it('clamps statPoints at 0 rather than going negative if fewer than 3*lost were actually banked', () => {
    // Only 1 stat point on hand but reversing 2 levels would naively want -6.
    expect(reverseXPGain(0, 3, 1, 400)).toEqual({
      xp: 0,
      level: 1,
      statPoints: 0,
      lost: 2,
    })
  })
})

describe('rankForLevel', () => {
  it('starts new hunters at E-Rank', () => {
    expect(rankForLevel(1)).toMatchObject({ name: 'E-Rank Hunter' })
  })

  it('picks the highest rank whose threshold has been reached', () => {
    expect(rankForLevel(24)).toMatchObject({ name: 'A-Rank Hunter' })
    expect(rankForLevel(29)).toMatchObject({ name: 'A-Rank Hunter' })
    expect(rankForLevel(30)).toMatchObject({ name: 'S-Rank Hunter' })
  })

  it('caps out at Shadow Monarch at level 100', () => {
    expect(rankForLevel(100)).toMatchObject({ name: 'Shadow Monarch' })
    expect(rankForLevel(250)).toMatchObject({ name: 'Shadow Monarch' })
  })
})
