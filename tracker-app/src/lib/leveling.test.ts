import { describe, expect, it } from 'vitest'
import { applyXPGain, xpForLevel } from './leveling'

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
