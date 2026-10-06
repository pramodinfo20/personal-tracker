import { describe, expect, it } from 'vitest'
import {
  dateKeyForTimezoneOffset,
  formatCountdown,
  formatCountdownCompact,
  isDateKey,
  localDateKey,
  nextResetAt,
  today,
} from './format'

describe('formatCountdown', () => {
  it('formats zero and sub-second remainders as 00:00:00', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(-500)).toBe('00:00:00')
  })

  it('formats seconds, minutes, and hours', () => {
    expect(formatCountdown(5000)).toBe('00:00:05')
    expect(formatCountdown(125000)).toBe('00:02:05')
    expect(formatCountdown(3661000)).toBe('01:01:01')
  })

  it('pads all segments to 2 digits', () => {
    expect(formatCountdown(9000)).toBe('00:00:09')
  })
})

describe('today', () => {
  it('returns the current date as YYYY-MM-DD', () => {
    expect(today()).toBe(localDateKey())
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('localDateKey', () => {
  it('uses the runtime local calendar day', () => {
    expect(localDateKey(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05')
    expect(localDateKey(new Date(2026, 9, 6, 0, 1))).toBe('2026-10-06')
  })

  it('models a positive timezone such as Asia/Kolkata', () => {
    expect(dateKeyForTimezoneOffset(new Date('2026-10-05T18:29:00.000Z'), 330)).toBe('2026-10-05')
    expect(dateKeyForTimezoneOffset(new Date('2026-10-05T18:31:00.000Z'), 330)).toBe('2026-10-06')
  })

  it('models a negative timezone west of UTC', () => {
    expect(dateKeyForTimezoneOffset(new Date('2026-10-06T06:59:00.000Z'), -420)).toBe('2026-10-05')
    expect(dateKeyForTimezoneOffset(new Date('2026-10-06T07:01:00.000Z'), -420)).toBe('2026-10-06')
  })

  it('validates real YYYY-MM-DD keys', () => {
    expect(isDateKey('2026-02-28')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('2026-2-3')).toBe(false)
  })
})

describe('formatCountdownCompact', () => {
  it('shows hours and minutes once past an hour', () => {
    expect(formatCountdownCompact(3600_000)).toBe('1h 0m')
    expect(formatCountdownCompact(4 * 3600_000 + 12 * 60_000)).toBe('4h 12m')
  })

  it('drops to minutes-only under an hour', () => {
    expect(formatCountdownCompact(45 * 60_000)).toBe('45m')
    expect(formatCountdownCompact(60_000)).toBe('1m')
  })

  it('drops to seconds-only under a minute', () => {
    expect(formatCountdownCompact(30_000)).toBe('30s')
    expect(formatCountdownCompact(0)).toBe('0s')
  })
})

describe('nextResetAt', () => {
  it('returns the next local midnight after the given time', () => {
    const noon = new Date(2026, 0, 15, 12, 0, 0).getTime()
    expect(nextResetAt(noon)).toBe(new Date(2026, 0, 16, 0, 0, 0).getTime())
  })

  it('rolls into the next day even a millisecond after midnight', () => {
    const justAfterMidnight = new Date(2026, 0, 15, 0, 0, 0, 1).getTime()
    expect(nextResetAt(justAfterMidnight)).toBe(new Date(2026, 0, 16, 0, 0, 0).getTime())
  })

  it('defaults to now when no timestamp is given', () => {
    const result = nextResetAt()
    expect(result).toBeGreaterThan(Date.now())
    expect(result - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
  })
})
