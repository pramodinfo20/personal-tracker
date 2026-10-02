// Wires the ported hunter/gate/quest/shadow logic from src/lib into real,
// localStorage-persisted state. Mirrors the handler logic from the
// HunterTab section of pramod-2026-tracker.html (grantXP, claimQuest,
// logTierAction, startGateAction, completeGateTaskAction, and the
// gate-expiry / daily-rollover effects), adapted to hooks + TypeScript.
//
// Note: the original's manual stat-point allocation (allocateStat) has been
// intentionally dropped — stats are read-only now, auto-incremented by
// grantXP. hunter.statPoints keeps accumulating (applyXPGain still returns
// it) purely for backward-compatible data shape; nothing spends it.

import { useEffect, useRef, useState } from 'react'
import {
  GATE_TEMPLATES,
  checkGateUnlock,
  isGateExpired,
  resolveGateBonusXP,
  startGate as buildActiveGate,
} from '../lib/gates'
import {
  DEFAULT_HUNTER,
  type Hunter,
  type LogEntry,
  type StatKey,
} from '../lib/hunterState'
import { applyXPGain, rankForLevel, reverseXPGain, type RankInfo } from '../lib/leveling'
import { findActivity } from '../lib/activities'
import { customQuestToClaimable, type CustomQuest } from '../lib/customQuests'
import {
  DAILY_LOG_CAP,
  isValidTier,
  questClaimEntry,
  type ClaimableQuest,
  type XPTier,
} from '../lib/quests'
import { SHADOW_MILESTONES } from '../lib/shadows'
import { today } from '../lib/format'
import { wouldStrandProgress } from '../lib/undoGuard'
import { useSaved } from './useSaved'

const HUNTER_STORAGE_KEY = 'p26_hunter'
const LOG_LIMIT = 40

// Always assigns the key (even to add 0), so a day with only a 0-XP entry
// (a failed gate) still registers as "active" in dailyXP the same way it
// always did as a log entry — see Hunter.dailyXP's doc comment.
const addDailyXP = (
  dailyXP: Record<string, number> | undefined,
  date: string,
  amount: number,
): Record<string, number> => {
  const key = date.slice(0, 10)
  const base = dailyXP || {}
  return { ...base, [key]: (base[key] || 0) + amount }
}

// Undo's counterpart to addDailyXP — same-day only (undo is already
// restricted to today's claims), so this only ever touches today's key.
const subtractDailyXP = (
  dailyXP: Record<string, number> | undefined,
  date: string,
  amount: number,
): Record<string, number> => {
  const key = date.slice(0, 10)
  const base = dailyXP || {}
  return { ...base, [key]: (base[key] || 0) - amount }
}

// One-time recovery for hunters saved before dailyXP existed: sums whatever
// is still in the (already-capped) log so Year/Month view isn't empty from
// today's launch onward. Can't recover entries that already rolled off the
// 40-entry cap before this ran — only what's still present right now.
const backfillDailyXP = (log: LogEntry[]): Record<string, number> => {
  const totals: Record<string, number> = {}
  for (const entry of log) {
    const key = entry.date.slice(0, 10)
    totals[key] = (totals[key] || 0) + entry.xp
  }
  return totals
}

export interface LevelUpEvent {
  level: number
  rank: RankInfo
  rankUp: boolean
  gained: number
  statPoints: number
}

export interface GateClearedEvent {
  name: string
  xp: number
}

export interface UndoResult {
  ok: boolean
  /** Set only when ok is false — why the undo was refused, for the UI to show. */
  reason?: string
}

// Extra provenance recorded on a log entry alongside label/xp/stat. All
// optional — entries from before tiers existed have none of these.
type EntryMeta = Pick<LogEntry, 'questId' | 'tier' | 'category'>

export function useHunter() {
  const [hunter, setHunter] = useSaved<Hunter>(HUNTER_STORAGE_KEY, DEFAULT_HUNTER)
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null)
  const [gateClearedEvent, setGateClearedEvent] = useState<GateClearedEvent | null>(null)
  const lastLogIdRef = useRef<number | null>(hunter.log[0]?.id ?? null)

  // New day: clear today's quest completions, bump the streak if anything
  // was done yesterday, and reset the free-text log cap.
  useEffect(() => {
    const td = today()
    if (hunter.lastQuestDate !== td) {
      const anyDoneYesterday = Object.values(hunter.completedToday || {}).some(Boolean)
      setHunter((h) => ({
        ...h,
        completedToday: {},
        lastQuestDate: td,
        streak: anyDoneYesterday ? (h.streak || 0) + 1 : 0,
        logCount: 0,
      }))
    }
    // Only ever needs to run once, on mount — matches the original's []-effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One-time migration: hunters saved before dailyXP existed load with it
  // `undefined` (useSaved does a plain JSON.parse, no default-merging), which
  // is how this is distinguished from a real, already-backfilled `{}`.
  useEffect(() => {
    setHunter((h) => (h.dailyXP ? h : { ...h, dailyXP: backfillDailyXP(h.log || []) }))
    // Only ever needs to run once, on mount — matches the daily-rollover effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detect a freshly-appended "Gate cleared:" log entry and surface it as a
  // one-shot overlay event, the same way the original watched hunter.log.
  useEffect(() => {
    const entry = hunter.log[0]
    if (!entry || entry.id === lastLogIdRef.current) return
    lastLogIdRef.current = entry.id
    if (entry.label.startsWith('Gate cleared:')) {
      setGateClearedEvent({ name: entry.label.replace('Gate cleared: ', ''), xp: entry.xp })
    }
  }, [hunter.log])

  const grantXP = (amount: number, stat: StatKey, label: string, meta: EntryMeta = {}) => {
    setHunter((h) => {
      const { xp, level, statPoints, gained } = applyXPGain(h.xp, h.level, h.statPoints, amount)
      const stats = { ...h.stats, [stat]: (h.stats?.[stat] || 0) + 1 }
      const entry: LogEntry = {
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        label,
        xp: amount,
        stat,
        ...(meta.questId ? { questId: meta.questId } : {}),
        ...(meta.tier ? { tier: meta.tier } : {}),
        ...(meta.category ? { category: meta.category } : {}),
      }
      const log = [entry, ...(h.log || [])].slice(0, LOG_LIMIT)
      const dailyXP = addDailyXP(h.dailyXP, entry.date, amount)
      const prevUnlocked = h.unlockedShadows || []
      const newlyUnlocked = SHADOW_MILESTONES.filter(
        (s) => level >= s.level && !prevUnlocked.includes(s.level),
      )
      const unlockedShadows = newlyUnlocked.length
        ? [...prevUnlocked, ...newlyUnlocked.map((s) => s.level)]
        : prevUnlocked
      if (gained > 0) {
        const newRank = rankForLevel(level)
        const oldRank = rankForLevel(h.level || 1)
        setTimeout(
          () =>
            setLevelUpEvent({
              level,
              rank: newRank,
              rankUp: newRank.name !== oldRank.name,
              gained,
              statPoints,
            }),
          50,
        )
      }
      return { ...h, xp, level, statPoints, stats, log, unlockedShadows, dailyXP }
    })
  }

  // The one claim path for every once-per-day quest — fixed DAILY_QUESTS
  // directly, custom quests via claimCustomQuest below. completedToday stays
  // a plain Record<string, boolean> keyed by quest id (unchanged shape, so
  // old saves need no migration); the XP, stat and tier actually granted
  // live on the claim's log entry, which is what undo reverses.
  const claimQuest = (quest: ClaimableQuest, tier: XPTier) => {
    if (hunter.completedToday?.[quest.id]) return
    if (!isValidTier(quest.tiers, tier)) return
    grantXP(tier.xp, quest.stat, quest.label, { questId: quest.id, tier: tier.label })
    setHunter((h) => ({ ...h, completedToday: { ...h.completedToday, [quest.id]: true } }))
  }

  // Custom quests only add an "is it still active?" check on top of the
  // shared path — a deactivated quest's card is hidden, but a stale tap
  // shouldn't be able to claim it.
  const claimCustomQuest = (quest: CustomQuest, tier: XPTier) => {
    if (!quest.active) return
    claimQuest(customQuestToClaimable(quest), tier)
  }

  // The one undo path for every quest type (fixed or custom) — only the id
  // is needed, since everything to reverse comes from the log entry.
  // Undo a quest claimed earlier TODAY (respects the same midnight-reset
  // boundary the daily-rollover effect uses — completedToday/lastQuestDate
  // are only ever "today's" by construction). Does the guard checks against
  // the current snapshot for an immediate synchronous result the UI can
  // show, then re-validates inside the updater against the freshest state
  // before actually mutating anything.
  const undoQuestClaim = (quest: Pick<ClaimableQuest, 'id'>): UndoResult => {
    if (hunter.lastQuestDate !== today()) {
      return { ok: false, reason: "That claim wasn't from today." }
    }
    if (!hunter.completedToday?.[quest.id]) {
      return { ok: false, reason: 'Nothing to undo.' }
    }
    // Reverses whatever XP the entry recorded — a new tiered claim or an old
    // fixed-XP one alike — never a value re-derived from today's tier table.
    const entry = questClaimEntry(hunter.log, quest.id, hunter.lastQuestDate)
    if (!entry) {
      return { ok: false, reason: "Couldn't find that claim in the log." }
    }

    const { level: newLevel } = reverseXPGain(hunter.xp, hunter.level, hunter.statPoints, entry.xp)
    const conflict = wouldStrandProgress(hunter, newLevel)
    if (conflict) {
      return {
        ok: false,
        reason: `Undoing this would drop you below the level needed for ${conflict} — not undoing automatically.`,
      }
    }

    setHunter((h) => {
      if (h.lastQuestDate !== today() || !h.completedToday?.[quest.id]) return h
      const liveEntry = questClaimEntry(h.log, quest.id, h.lastQuestDate)
      if (!liveEntry) return h
      const { xp, level, statPoints } = reverseXPGain(h.xp, h.level, h.statPoints, liveEntry.xp)
      // The stat comes from the LOGGED entry, not the quest definition: a
      // custom quest's stat can be edited between claim and undo, and the
      // entry is what reflects exactly what was granted. (For fixed quests
      // the two always agree.)
      const entryStat = liveEntry.stat
      const stats =
        entryStat === 'GATE'
          ? h.stats
          : { ...h.stats, [entryStat]: Math.max(0, (h.stats?.[entryStat] || 0) - 1) }
      const log = h.log.filter((e) => e !== liveEntry)
      const dailyXP = subtractDailyXP(h.dailyXP, liveEntry.date, liveEntry.xp)
      const completedToday = { ...h.completedToday }
      delete completedToday[quest.id]
      return { ...h, xp, level, statPoints, stats, log, dailyXP, completedToday }
    })

    return { ok: true }
  }

  // A one-off log of an ACTIVITY_LIBRARY activity at one of its fixed tiers
  // — the same activities recurring custom quests are created from, just
  // claimed once instead of saved. Takes the activity id (not an object) so
  // the tiers checked against are always the library's own; the optional
  // note adds detail to the entry's label.
  const logActivity = (activityId: string, tier: XPTier, note = '') => {
    const activity = findActivity(activityId)
    if (!activity || !isValidTier(activity.tiers, tier)) return
    if ((hunter.logCount || 0) >= DAILY_LOG_CAP) return
    const trimmed = note.trim()
    const label = trimmed ? `${activity.name}: ${trimmed}` : activity.name
    grantXP(tier.xp, activity.statKey, label, { tier: tier.label, category: activity.category })
    setHunter((h) => ({ ...h, logCount: (h.logCount || 0) + 1 }))
  }

  const renameHunter = (name: string) => {
    const trimmed = name.trim()
    // A blank name would make the onboarding gate (hunter.name === '') true
    // again on next launch — never allow renaming back to empty.
    if (!trimmed) return
    setHunter((h) => ({ ...h, name: trimmed }))
  }

  // Onboarding's two screens land as one atomic update so there's no
  // intermediate render with a name but no focus (or vice versa).
  const completeOnboarding = (name: string, focusStats: StatKey[]) => {
    const trimmed = name.trim() || 'Hunter'
    setHunter((h) => ({
      ...h,
      name: trimmed,
      focusStats,
      joinedAt: h.joinedAt ?? new Date().toISOString(),
    }))
  }

  const startGateAction = () => {
    const availableGate = hunter.activeGate
      ? null
      : checkGateUnlock(hunter.level || 1, hunter.clearedGates || [])
    if (hunter.activeGate || !availableGate) return
    setHunter((h) => (h.activeGate ? h : { ...h, activeGate: buildActiveGate(availableGate) }))
  }

  const completeGateTask = (taskId: string) => {
    setHunter((h) => {
      if (!h.activeGate) return h
      const activeGate = h.activeGate
      const template = GATE_TEMPLATES.find((g) => g.id === activeGate.templateId)
      if (!template || !template.tasks.some((t) => t.id === taskId)) return h
      if (activeGate.completedTasks?.[taskId]) return h
      const completedTasks = { ...activeGate.completedTasks, [taskId]: true }
      const allDone = template.tasks.every((t) => completedTasks[t.id])
      if (!allDone) return { ...h, activeGate: { ...activeGate, completedTasks } }

      const bonus = resolveGateBonusXP(template)
      const { xp, level, statPoints, gained } = applyXPGain(h.xp, h.level, h.statPoints, bonus)
      const entry: LogEntry = {
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        label: `Gate cleared: ${template.name}`,
        xp: bonus,
        stat: 'GATE',
      }
      const log = [entry, ...(h.log || [])].slice(0, LOG_LIMIT)
      const dailyXP = addDailyXP(h.dailyXP, entry.date, bonus)
      const clearedGates = [...(h.clearedGates || []), template.id]
      if (gained > 0) {
        const newRank = rankForLevel(level)
        const oldRank = rankForLevel(h.level || 1)
        setTimeout(
          () =>
            setLevelUpEvent({
              level,
              rank: newRank,
              rankUp: newRank.name !== oldRank.name,
              gained,
              statPoints,
            }),
          50,
        )
      }
      return { ...h, xp, level, statPoints, log, clearedGates, dailyXP, activeGate: null }
    })
  }

  const handleGateExpire = () => {
    setHunter((h) => {
      if (!h.activeGate || !isGateExpired(h.activeGate)) return h
      const entry: LogEntry = {
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        label: `Gate failed: ${h.activeGate.name}`,
        xp: 0,
        stat: 'GATE',
      }
      const log = [entry, ...(h.log || [])].slice(0, LOG_LIMIT)
      // 0 XP, but still registers the day as active — see addDailyXP's comment.
      const dailyXP = addDailyXP(h.dailyXP, entry.date, 0)
      return { ...h, activeGate: null, log, dailyXP }
    })
  }

  // ── DEV TESTING ONLY — ported from pramod-2026-tracker.html's throwaway
  // debug panel. Writes hunter state directly; never goes through
  // applyXPGain/grantXP/claimQuest or the real gate-progress logic.
  const dev = {
    // Wipes everything, including the name — so onboarding shows again.
    resetHunter: () => setHunter(() => ({ ...DEFAULT_HUNTER, lastQuestDate: today() })),
    jumpToLevel: (level: number) => {
      const lvl = Math.max(1, Math.floor(Number(level) || 1))
      setHunter((h) => ({ ...h, level: lvl, xp: 0 }))
    },
    clearGateHistory: () => setHunter((h) => ({ ...h, clearedGates: [] })),
  }

  return {
    hunter,
    dev,
    claimQuest,
    claimCustomQuest,
    undoQuestClaim,
    logActivity,
    renameHunter,
    completeOnboarding,
    startGate: startGateAction,
    completeGateTask,
    handleGateExpire,
    levelUpEvent,
    dismissLevelUp: () => setLevelUpEvent(null),
    gateClearedEvent,
    dismissGateCleared: () => setGateClearedEvent(null),
  }
}
