import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { ONBOARDING_COPY, TODAY_COPY } from '../../lib/copy'
import type { CustomQuest } from '../../lib/customQuests'
import type { Hunter } from '../../lib/hunterState'
import { today } from '../../lib/format'
import { questEntries, visibleQuests } from '../../lib/questVisibility'
import {
  allQuestsClaimed,
  questXPOnDate,
  type ClaimableQuest,
  type XPTier,
} from '../../lib/quests'
import {
  ActivityPickerSheet,
  DayCompleteCard,
  GateBanner,
  HunterHeroPanel,
  QuestCards,
  QuestsResetTimer,
} from '../hunter'
import { Button, ScreenBackground } from '../ui'

export interface TodayScreenProps {
  hunter: Hunter
  customQuests: CustomQuest[]
  onClaimQuest: (quest: ClaimableQuest, tier: XPTier) => void
  onClaimCustomQuest: (quest: CustomQuest, tier: XPTier) => void
  onUndoQuest: (quest: ClaimableQuest) => UndoResult
  onLogActivity: (activityId: string, tier: XPTier, note: string) => void
  /** Opens the Manage Quests screen (from the "no quests enabled" empty state). */
  onManageQuests: () => void
  onStartGate: () => void
  onCompleteGateTask: (taskId: string) => void
  onGateExpire: () => void
  /**
   * Show the one-time welcome banner (first arrival after finishing setup).
   * It dismisses itself after a few seconds, or on tap, via onDismissWelcome.
   */
  showWelcome?: boolean
  onDismissWelcome?: () => void
}

const WELCOME_MS = 6000

// The app's default/home view: gate banner up top (impossible to miss),
// then the day's quests as big one-tap cards, with a floating "+" for
// quick-logging a custom activity without leaving the screen.
export function TodayScreen({
  hunter,
  customQuests,
  onClaimQuest,
  onClaimCustomQuest,
  onUndoQuest,
  onLogActivity,
  onManageQuests,
  onStartGate,
  onCompleteGateTask,
  onGateExpire,
  showWelcome = false,
  onDismissWelcome,
}: TodayScreenProps) {
  useEffect(() => {
    if (!showWelcome || !onDismissWelcome) return
    const t = setTimeout(onDismissWelcome, WELCOME_MS)
    return () => clearTimeout(t)
  }, [showWelcome, onDismissWelcome])

  const [logSheetOpen, setLogSheetOpen] = useState(false)
  // Once every quest is claimed, DayCompleteCard normally replaces the
  // quest list — this lets the player peek back at it (to undo a claim)
  // without losing the celebratory state on every future visit.
  const [showQuestsAnyway, setShowQuestsAnyway] = useState(false)

  // One visibility filter for every quest — fixed and custom alike (see
  // lib/questVisibility.ts). The two kinds are only split afterwards for
  // layout: the Day Complete card stands in for the built-in ones.
  const visible = useMemo(
    () => visibleQuests(questEntries(hunter.hiddenQuestIds, customQuests)),
    [hunter.hiddenQuestIds, customQuests],
  )
  const visibleFixed = useMemo(
    () => visible.filter((e) => e.kind === 'fixed').map((e) => e.quest),
    [visible],
  )
  const visibleCustom = useMemo(
    () => visible.filter((e) => e.kind === 'custom').map((e) => e.quest),
    [visible],
  )
  // "Day complete" = every built-in quest the user has left enabled is
  // claimed (never true when none are enabled).
  const allDone = allQuestsClaimed(hunter.completedToday, visibleFixed)

  // Custom cards render as ClaimableQuest; route the claim back through the
  // stored quest so claimCustomQuest can still check it's active.
  const claimCustom = (q: ClaimableQuest, tier: XPTier) => {
    const quest = customQuests.find((c) => c.id === q.id)
    if (quest) onClaimCustomQuest(quest, tier)
  }

  return (
    <ScreenBackground screen="today" className="pb-28 text-text-primary">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 sm:px-6">
        {showWelcome && (
          <div
            role="status"
            className="hud-glass hud-enter flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          >
            <p className="text-[13px] text-text-secondary">{ONBOARDING_COPY.complete}</p>
            <button
              type="button"
              onClick={onDismissWelcome}
              aria-label="Dismiss welcome"
              className="shrink-0 cursor-pointer text-xl leading-none text-text-muted hover:text-text-primary"
            >
              ×
            </button>
          </div>
        )}
        <HunterHeroPanel hunter={hunter} />
        <GateBanner
          hunter={hunter}
          onStartGate={onStartGate}
          onCompleteTask={onCompleteGateTask}
          onGateExpire={onGateExpire}
        />
        <QuestsResetTimer />
        {visible.length === 0 && (
          // Everything hidden: say so and offer the way back, rather than
          // leaving a blank screen.
          <div
            className="hud-glass hud-enter rounded-2xl p-6 text-center"
            style={{ '--i': 3 } as CSSProperties}
          >
            <div className="hud-icon mx-auto h-14 w-14 text-3xl" aria-hidden="true">
              🗒️
            </div>
            <p className="mt-3 text-sm text-text-secondary">{TODAY_COPY.emptyQuests}</p>
            <div className="mt-1 text-base font-extrabold text-text-primary">No quests enabled</div>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your quests to add some back.
            </p>
            <Button onClick={onManageQuests} className="mt-4">
              Manage Quests
            </Button>
          </div>
        )}
        {allDone && !showQuestsAnyway ? (
          <DayCompleteCard
            streak={hunter.streak}
            questCount={visibleFixed.length}
            xpToday={questXPOnDate(hunter.log, today(), visibleFixed)}
            onEditClaims={() => setShowQuestsAnyway(true)}
          />
        ) : (
          <QuestCards
            quests={visibleFixed}
            completedToday={hunter.completedToday}
            log={hunter.log}
            onClaim={onClaimQuest}
            onUndo={onUndoQuest}
            enterOffset={3}
          />
        )}
        {/* Custom quests are independent of the built-in ones' "all done"
            state above — they stay visible either way, since
            DayCompleteCard is deliberately scoped to the built-in quests.
            Same QuestCards component, so same picker and undo flow. */}
        <QuestCards
          quests={visibleCustom}
          completedToday={hunter.completedToday}
          log={hunter.log}
          onClaim={claimCustom}
          onUndo={onUndoQuest}
          enterOffset={3 + visibleFixed.length}
        />
        {/* Discovery hint for Manage Quests — not shown with the empty
            state above, which already has its own button there. Left-
            aligned so it never sits under the floating "+" at page end. */}
        {visible.length > 0 && (
          <button
            type="button"
            onClick={onManageQuests}
            className="cursor-pointer self-start rounded-full bg-backing/50 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            Want different quests?{' '}
            <span className="font-bold text-accent-hover">Manage Quests →</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setLogSheetOpen(true)}
        aria-label="Log an activity"
        className="glow-accent fixed right-4 bottom-24 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(var(--rgb-accent-hover)),var(--color-accent)_55%,var(--color-accent-active))] text-3xl leading-none font-bold text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-8px_rgb(var(--rgb-shadow)/0.7),0_0_var(--hud-glow-spread)_rgb(var(--glow)/0.6)] transition-transform active:scale-95"
      >
        +
      </button>

      {logSheetOpen && (
        <ActivityPickerSheet
          mode="log"
          logCount={hunter.logCount}
          onLog={onLogActivity}
          onClose={() => setLogSheetOpen(false)}
        />
      )}
    </ScreenBackground>
  )
}
