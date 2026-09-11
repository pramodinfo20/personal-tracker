import { describe, expect, it } from 'vitest'
import { formatCountdown } from './format'

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
