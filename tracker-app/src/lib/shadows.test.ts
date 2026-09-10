import { describe, expect, it } from 'vitest'
import { SHADOW_MILESTONES } from './shadows'

describe('SHADOW_MILESTONES', () => {
  it('has 10 milestones sorted by ascending level', () => {
    expect(SHADOW_MILESTONES).toHaveLength(10)
    const levels = SHADOW_MILESTONES.map((s) => s.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
  })

  it('starts at level 5 (Ash Wolf) and ends at level 100 (The Shadow Monarch)', () => {
    expect(SHADOW_MILESTONES[0]).toMatchObject({ level: 5, name: 'Ash Wolf' })
    expect(SHADOW_MILESTONES.at(-1)).toMatchObject({
      level: 100,
      name: 'The Shadow Monarch',
    })
  })
})
