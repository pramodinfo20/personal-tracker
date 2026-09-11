// Ported as-is from pramod-2026-tracker.html (fmtCountdown, today).

export const formatCountdown = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export const today = (): string => new Date().toISOString().split('T')[0]

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
// today()'s UTC date string, so "reset" means the next UTC midnight — not
// local midnight. Kept in sync with that boundary on purpose.
export const nextResetAt = (from: number = Date.now()): number => {
  const d = new Date(from)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0)
}
