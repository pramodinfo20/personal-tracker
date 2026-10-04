// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyStatXP } from '../../lib/statHistory'
import { CalendarScreen } from './CalendarScreen'

// "Today" is Sunday 4 Oct 2026 (UTC).
const NOW = new Date('2026-10-04T10:00:00.000Z')

const DAILY_XP: Record<string, number> = {
  '2026-10-04': 45, // today: INT 25 + STR 20
  '2026-10-03': 165, // STR 45 + gate 120
  '2026-10-01': 0, // failed gate: active, no XP
  '2026-09-20': 80, // older than per-stat history: unattributed
  '2026-03-10': 60, // only reachable by paging back
}
const DAILY_STAT_XP: DailyStatXP = {
  '2026-10-04': { INT: 25, STR: 20 },
  '2026-10-03': { STR: 45, GATE: 120 },
  '2026-10-01': { GATE: 0 },
  '2026-03-10': { VIT: 60 },
}

const mount = (dailyXP = DAILY_XP, dailyStatXP: DailyStatXP | undefined = DAILY_STAT_XP) =>
  render(<CalendarScreen dailyXP={dailyXP} dailyStatXP={dailyStatXP} onBack={() => {}} />)

const day = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}: `) })
const detail = () => within(screen.getByLabelText('Selected day'))
// The XP figure next to a stat's row in the breakdown bars.
const statXP = (stat: string) => detail().getByText(stat).parentElement!.querySelector('.font-mono')!.textContent

describe('CalendarScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows the last 12 weeks: one cell per day up to today, none for the future', () => {
    mount()
    expect(screen.getByText('Jul 13 – Oct 4, 2026')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /: \d+ XP$/ })).toHaveLength(84)
    expect(day('Jul 13')).toBeTruthy()
    expect(day('Oct 4').getAttribute('aria-label')).toBe('Oct 4: 45 XP')
    expect(screen.getByText(/4 active days/)).toBeTruthy()
  })

  it('shades cells by XP: nothing for an empty day, strongest for the busiest', () => {
    mount()
    expect(day('Oct 2').dataset.level).toBe('0')
    expect(day('Oct 1').dataset.level).toBe('0') // active but 0 XP
    expect(day('Oct 3').dataset.level).toBe('4') // 165 = the peak
    expect(day('Oct 4').dataset.level).toBe('2') // 45 of 165
    expect(day('Sep 20').dataset.level).toBe('2') // 80 of 165
  })

  it('starts on today, with its total and per-stat breakdown', () => {
    mount()
    expect(detail().getByText('Sun, Oct 4, 2026')).toBeTruthy()
    expect(detail().getByText('45 XP')).toBeTruthy()
    expect(statXP('INT')).toBe('25')
    expect(statXP('STR')).toBe('20')
    expect(statXP('VIT')).toBe('0')
    expect(day('Oct 4').getAttribute('aria-pressed')).toBe('true')
  })

  it('tapping a day shows THAT day: stats plus the gate bonus that is not tied to a stat', () => {
    mount()
    fireEvent.click(day('Oct 3'))
    expect(detail().getByText('Sat, Oct 3, 2026')).toBeTruthy()
    expect(detail().getByText('165 XP')).toBeTruthy()
    expect(statXP('STR')).toBe('45')
    expect(statXP('INT')).toBe('0')
    expect(detail().getByText(/Includes 120 XP from a gate bonus/)).toBeTruthy()
    expect(day('Oct 3').getAttribute('aria-pressed')).toBe('true')
    expect(day('Oct 4').getAttribute('aria-pressed')).toBe('false')
  })

  it('says so for a day with no activity, and for an active day with no XP', () => {
    mount()
    fireEvent.click(day('Oct 2'))
    expect(detail().getByText('No activity this day.')).toBeTruthy()
    fireEvent.click(day('Oct 1'))
    expect(detail().getByText('Active, but no XP earned this day.')).toBeTruthy()
  })

  it('flags XP from before per-stat history instead of showing a wrong split', () => {
    mount()
    fireEvent.click(day('Sep 20'))
    expect(detail().getByText('80 XP')).toBeTruthy()
    expect(detail().getByText(/80 XP on this day was earned before per-stat history/)).toBeTruthy()
  })

  it('pages back only as far as there is history, and forward again', () => {
    mount()
    const earlier = screen.getByRole('button', { name: 'Earlier weeks' }) as HTMLButtonElement
    const later = screen.getByRole('button', { name: 'Later weeks' }) as HTMLButtonElement
    expect(later.disabled).toBe(true)
    expect(earlier.disabled).toBe(false)

    fireEvent.click(earlier)
    expect(screen.getByText('Apr 20 – Jul 12, 2026')).toBeTruthy()
    expect(earlier.disabled).toBe(false) // Mar 10 is one page further back

    fireEvent.click(earlier)
    expect(screen.getByText('Jan 26 – Apr 19, 2026')).toBeTruthy()
    expect(earlier.disabled).toBe(true)
    fireEvent.click(day('Mar 10'))
    expect(detail().getByText('60 XP')).toBeTruthy()
    expect(statXP('VIT')).toBe('60')

    fireEvent.click(later)
    fireEvent.click(later)
    expect(screen.getByText('Jul 13 – Oct 4, 2026')).toBeTruthy()
    expect(later.disabled).toBe(true)
  })

  it('a brand-new hunter gets an empty grid and no paging', () => {
    mount({}, undefined)
    expect(screen.getAllByRole('button', { name: /: 0 XP$/ })).toHaveLength(84)
    expect((screen.getByRole('button', { name: 'Earlier weeks' }) as HTMLButtonElement).disabled).toBe(true)
    expect(detail().getByText('No activity this day.')).toBeTruthy()
    expect(screen.getByText(/0 active days/)).toBeTruthy()
  })
})
