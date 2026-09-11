import { describe, expect, it } from 'vitest'
import { formatCountdown, formatCountdownCompact, nextResetAt, today } from './format'

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
    expect(today()).toBe(new Date().toISOString().split('T')[0])
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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
  it('returns the next UTC midnight after the given time', () => {
    const noon = Date.UTC(2026, 0, 15, 12, 0, 0)
    expect(nextResetAt(noon)).toBe(Date.UTC(2026, 0, 16, 0, 0, 0))
  })

  it('rolls into the next day even a millisecond after midnight', () => {
    const justAfterMidnight = Date.UTC(2026, 0, 15, 0, 0, 0, 1)
    expect(nextResetAt(justAfterMidnight)).toBe(Date.UTC(2026, 0, 16, 0, 0, 0))
  })

  it('defaults to now when no timestamp is given', () => {
    const result = nextResetAt()
    expect(result).toBeGreaterThan(Date.now())
    expect(result - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
  })
})
