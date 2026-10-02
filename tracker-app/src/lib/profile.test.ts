import { describe, expect, it } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from './hunterState'
import { avatarInitial, formatJoinDate, joinDateFor } from './profile'

const hunterWith = (over: Partial<Hunter>): Hunter => ({ ...DEFAULT_HUNTER, ...over })

describe('avatarInitial', () => {
  it('uppercases the first letter of the name', () => {
    expect(avatarInitial('pramod')).toBe('P')
  })

  it('ignores leading whitespace', () => {
    expect(avatarInitial('  jin')).toBe('J')
  })

  it("doesn't split an emoji first character", () => {
    expect(avatarInitial('🗡️ Shadow')).toBe('🗡')
  })

  it('falls back to ? for an empty name', () => {
    expect(avatarInitial('   ')).toBe('?')
  })
})

describe('joinDateFor', () => {
  it('uses joinedAt when present', () => {
    expect(joinDateFor(hunterWith({ joinedAt: '2026-09-01T10:00:00.000Z' }))).toEqual({
      date: '2026-09-01',
      approximate: false,
    })
  })

  it('falls back to the earliest activity for hunters from before joinedAt existed', () => {
    const h = hunterWith({
      dailyXP: { '2026-08-20': 25, '2026-08-15': 10 },
      log: [{ id: 1, date: '2026-08-18T09:00:00.000Z', label: 'x', xp: 5, stat: 'STR' }],
    })
    expect(joinDateFor(h)).toEqual({ date: '2026-08-15', approximate: true })
  })

  it('tolerates a missing dailyXP (pre-dailyXP save)', () => {
    const h = hunterWith({
      dailyXP: undefined as unknown as Record<string, number>,
      log: [{ id: 1, date: '2026-08-18T09:00:00.000Z', label: 'x', xp: 5, stat: 'STR' }],
    })
    expect(joinDateFor(h)).toEqual({ date: '2026-08-18', approximate: true })
  })

  it('is null with no joinedAt and no activity', () => {
    expect(joinDateFor(hunterWith({}))).toBeNull()
  })
})

describe('formatJoinDate', () => {
  it('formats a date key without timezone drift', () => {
    expect(formatJoinDate('2026-03-15')).toBe('Mar 15, 2026')
  })
})
