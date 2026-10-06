// DEV TESTING ONLY — the state edits behind the Dev Testing panel
// (components/hunter/DevTestingPanel.tsx). The panel and these actions are
// both gated by isDevToolsEnabled() in lib/devToolsGate.ts: dev builds, or a
// live build with the env flag on in a browser that has been unlocked. These write the save directly and bypass the real XP, claim and
// ticket rules on purpose: they exist to set up a situation in seconds
// (a level, some tickets, a streak) so the real logic can then be exercised.

import { COMPANION_MILESTONES } from './companions'
import { localDateKey } from './format'
import type { Hunter } from './hunterState'

const localKey = (now: Date, daysAgo: number): string =>
  localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo))

const wholeNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.floor(Number(value) || 0)))

// Put the hunter at exactly this level (XP in the level reset to 0), with
// the milestone record matching: every milestone at or below the level is
// marked reached and any above it is cleared. So companion rank access
// reads exactly as it would for a hunter who really is this level —
// jumping DOWN re-locks ranks, which a plain level change would not.
export const devSetLevel = (h: Hunter, level: number): Hunter => {
  const lvl = wholeNumber(level, 1, 999)
  return {
    ...h,
    level: lvl,
    xp: 0,
    unlockedShadows: COMPANION_MILESTONES.filter((m) => m <= lvl),
  }
}

/** Add summon tickets without earning them. */
export const devGrantTickets = (h: Hunter, count: number): Hunter => ({
  ...h,
  tickets: (h.tickets ?? 0) + wholeNumber(count, 0, 999),
})

/** XP written on a day that had none, to make it count toward the streak. */
export const DEV_STREAK_DAY_XP = 10

// Make the current streak exactly `days` long, ending today: every one of
// the last `days` days gets XP (days that already have some keep it), and
// the day before that run is emptied so the streak can't be longer. 0
// empties today and yesterday. Also clears the "bonus ticket already given
// today" marker, so setting 7 (or 14, 21 …) and then claiming any quest
// shows the streak bonus ticket being awarded.
//
// This rewrites dailyXP, so Progress and Calendar will show the made-up
// days — it's a test fixture, not something to use on a save you care about.
export const devSetStreak = (h: Hunter, days: number, now: Date = new Date()): Hunter => {
  const n = wholeNumber(days, 0, 3650)
  const dailyXP = { ...(h.dailyXP ?? {}) }
  for (let i = 0; i < n; i++) {
    const key = localKey(now, i)
    if (!((dailyXP[key] ?? 0) > 0)) dailyXP[key] = DEV_STREAK_DAY_XP
  }
  delete dailyXP[localKey(now, n)]
  if (n === 0) delete dailyXP[localKey(now, 1)]
  const { lastStreakTicketDate: _cleared, ...rest } = h
  return { ...rest, dailyXP }
}
