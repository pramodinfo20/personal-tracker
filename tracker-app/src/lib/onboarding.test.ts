import { describe, expect, it } from 'vitest'
import { FOCUS_OPTIONS } from './onboarding'

describe('FOCUS_OPTIONS', () => {
  it('has 4 options with unique keys', () => {
    expect(FOCUS_OPTIONS).toHaveLength(4)
    expect(new Set(FOCUS_OPTIONS.map((o) => o.key)).size).toBe(4)
  })

  it('maps every option except Balanced to a stat key', () => {
    const balanced = FOCUS_OPTIONS.find((o) => o.key === 'balanced')
    expect(balanced?.statKey).toBeNull()
    const others = FOCUS_OPTIONS.filter((o) => o.key !== 'balanced')
    expect(others.every((o) => o.statKey !== null)).toBe(true)
  })
})
