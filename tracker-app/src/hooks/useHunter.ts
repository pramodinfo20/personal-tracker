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
import { DAILY_LOG_CAP, type DailyQuest, type LogXPTier } from '../lib/quests'
import { SHADOW_MILESTONES } from '../lib/shadows'
import { today } from '../lib/format'
import { wouldStrandProgress } from '../lib/undoGuard'
import { useSaved } from './useSaved'

const HUNTER_STORAGE_KEY = 'p26_hunter'
const LOG_LIMIT = 40

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

  const grantXP = (amount: number, stat: StatKey, label: string, questId?: string) => {
    setHunter((h) => {
      const { xp, level, statPoints, gained } = applyXPGain(h.xp, h.level, h.statPoints, amount)
      const stats = { ...h.stats, [stat]: (h.stats?.[stat] || 0) + 1 }
      const entry: LogEntry = {
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        label,
        xp: amount,
        stat,
        ...(questId ? { questId } : {}),
      }
      const log = [entry, ...(h.log || [])].slice(0, LOG_LIMIT)
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
      return { ...h, xp, level, statPoints, stats, log, unlockedShadows }
    })
  }

  const claimQuest = (quest: DailyQuest) => {
    if (hunter.completedToday?.[quest.id]) return
    grantXP(quest.xp, quest.stat, quest.label, quest.id)
    setHunter((h) => ({ ...h, completedToday: { ...h.completedToday, [quest.id]: true } }))
  }

  // Undo a quest claimed earlier TODAY (respects the same midnight-reset
  // boundary the daily-rollover effect uses — completedToday/lastQuestDate
  // are only ever "today's" by construction). Does the guard checks against
  // the current snapshot for an immediate synchronous result the UI can
  // show, then re-validates inside the updater against the freshest state
  // before actually mutating anything.
  const undoQuestClaim = (quest: DailyQuest): UndoResult => {
    if (hunter.lastQuestDate !== today()) {
      return { ok: false, reason: "That claim wasn't from today." }
    }
    if (!hunter.completedToday?.[quest.id]) {
      return { ok: false, reason: 'Nothing to undo.' }
    }
    const entry = hunter.log.find((e) => e.questId === quest.id)
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
      const liveEntry = h.log.find((e) => e.questId === quest.id)
      if (!liveEntry) return h
      const { xp, level, statPoints } = reverseXPGain(h.xp, h.level, h.statPoints, liveEntry.xp)
      const stats = {
        ...h.stats,
        [quest.stat]: Math.max(0, (h.stats?.[quest.stat] || 0) - 1),
      }
      const log = h.log.filter((e) => e !== liveEntry)
      const completedToday = { ...h.completedToday }
      delete completedToday[quest.id]
      return { ...h, xp, level, statPoints, stats, log, completedToday }
    })

    return { ok: true }
  }

  const logActivity = (tier: LogXPTier, label: string, stat: StatKey) => {
    const trimmed = label.trim()
    if (!trimmed) return
    if ((hunter.logCount || 0) >= DAILY_LOG_CAP) return
    grantXP(tier.xp, stat, trimmed)
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
    setHunter((h) => ({ ...h, name: trimmed, focusStats }))
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
      return { ...h, xp, level, statPoints, log, clearedGates, activeGate: null }
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
      return { ...h, activeGate: null, log }
    })
  }

  return {
    hunter,
    claimQuest,
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
