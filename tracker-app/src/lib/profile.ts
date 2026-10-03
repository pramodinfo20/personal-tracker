// Small derivations for the header avatar and the Profile sheet.

import type { Hunter } from './hunterState'

// First letter of the hunter's name for the round avatar — a placeholder
// until photo upload exists. Array.from so an emoji/astral first character
// isn't split in half.
export const avatarInitial = (name: string): string => {
  const first = Array.from(name.trim())[0]
  return first ? first.toUpperCase() : '?'
}

export interface JoinDate {
  /** "YYYY-MM-DD" */
  date: string
  /**
   * true when this is inferred from the earliest recorded activity rather
   * than an actual joinedAt — hunters who onboarded before joinedAt existed
   * have no real join date, so the UI labels it "Active since" instead.
   */
  approximate: boolean
}

export const joinDateFor = (hunter: Hunter): JoinDate | null => {
  if (hunter.joinedAt) return { date: hunter.joinedAt.slice(0, 10), approximate: false }
  const keys = [
    ...Object.keys(hunter.dailyXP || {}),
    ...(hunter.log || []).map((e) => e.date.slice(0, 10)),
  ].sort()
  return keys.length ? { date: keys[0], approximate: true } : null
}

// "2026-03-15" -> "Mar 15, 2026", parsed as UTC noon so no local timezone
// can shift the day (same convention as formatDayLabel in progress.ts).
export const formatJoinDate = (dateKey: string): string =>
  new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

// The optional body details from setup, formatted for the Profile sheet —
// only the ones actually provided ("28 yrs", "178 cm", "74 kg").
export const profileDetails = (hunter: Hunter): string[] => [
  ...(hunter.age !== undefined ? [`${hunter.age} yrs`] : []),
  ...(hunter.heightCm !== undefined ? [`${hunter.heightCm} cm`] : []),
  ...(hunter.weightKg !== undefined ? [`${hunter.weightKg} kg`] : []),
]
