// Ported as-is from pramod-2026-tracker.html (fmtCountdown), plus the
// tracker-wide local calendar date helpers.

const pad = (n: number): string => String(n).padStart(2, '0')

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

// The one canonical app date key: the user's local calendar day as
// YYYY-MM-DD. Stored keys keep this same shape; only the boundary is local.
export const localDateKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Deterministic helper for tests and timezone-equivalent calculations.
// offsetMinutes is minutes east of UTC (Asia/Kolkata = +330).
export const dateKeyForTimezoneOffset = (d: Date, offsetMinutes: number): string => {
  const shifted = new Date(d.getTime() + offsetMinutes * 60_000)
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
}

export const isDateKey = (v: unknown): v is string => {
  if (typeof v !== 'string' || !DATE_KEY.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export const dateKeyFromTimestamp = (value: string | number | Date): string =>
  typeof value === 'string' && isDateKey(value) ? value : localDateKey(new Date(value))

export const formatCountdown = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export const today = (): string => localDateKey()

// A lower-key sibling of formatCountdown for indicators that don't need
// second-by-second HH:MM:SS precision — e.g. "quests reset in 4h 12m".
export const formatCountdownCompact = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

// The daily quest rollover (see useHunter's lastQuestDate effect) keys off
// today()'s local date string, so "reset" means the next local midnight.
export const nextResetAt = (from: number = Date.now()): number => {
  const d = new Date(from)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
}
