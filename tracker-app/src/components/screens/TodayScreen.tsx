import { useMemo, useState } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import {
  activeCustomQuests,
  customQuestToClaimable,
  type CustomQuest,
} from '../../lib/customQuests'
import type { Hunter } from '../../lib/hunterState'
import { today } from '../../lib/format'
import { screenBackground } from '../../lib/screenBackgrounds'
import {
  allQuestsClaimed,
  DAILY_QUESTS,
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
import { ScreenBackground } from '../ui'

export interface TodayScreenProps {
  hunter: Hunter
  customQuests: CustomQuest[]
  onClaimQuest: (quest: ClaimableQuest, tier: XPTier) => void
  onClaimCustomQuest: (quest: CustomQuest, tier: XPTier) => void
  onUndoQuest: (quest: ClaimableQuest) => UndoResult
  onLogActivity: (activityId: string, tier: XPTier, note: string) => void
  onStartGate: () => void
  onCompleteGateTask: (taskId: string) => void
  onGateExpire: () => void
}

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
  onStartGate,
  onCompleteGateTask,
  onGateExpire,
}: TodayScreenProps) {
  const [logSheetOpen, setLogSheetOpen] = useState(false)
  // Once every quest is claimed, DayCompleteCard normally replaces the
  // quest list — this lets the player peek back at it (to undo a claim)
  // without losing the celebratory state on every future visit.
  const [showQuestsAnyway, setShowQuestsAnyway] = useState(false)

  const allDone = allQuestsClaimed(hunter.completedToday)
  const customClaimables = useMemo(
    () => activeCustomQuests(customQuests).map(customQuestToClaimable),
    [customQuests],
  )

  // Custom cards render as ClaimableQuest; route the claim back through the
  // stored quest so claimCustomQuest can still check it's active.
  const claimCustom = (q: ClaimableQuest, tier: XPTier) => {
    const quest = customQuests.find((c) => c.id === q.id)
    if (quest) onClaimCustomQuest(quest, tier)
  }

  return (
    <ScreenBackground image={screenBackground('today')} className="pb-28 text-text-primary">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 sm:px-6">
        <HunterHeroPanel hunter={hunter} />
        <GateBanner
          hunter={hunter}
          onStartGate={onStartGate}
          onCompleteTask={onCompleteGateTask}
          onGateExpire={onGateExpire}
        />
        <QuestsResetTimer />
        {allDone && !showQuestsAnyway ? (
          <DayCompleteCard
            streak={hunter.streak}
            xpToday={questXPOnDate(hunter.log, today())}
            onEditClaims={() => setShowQuestsAnyway(true)}
          />
        ) : (
          <QuestCards
            quests={DAILY_QUESTS}
            completedToday={hunter.completedToday}
            log={hunter.log}
            onClaim={onClaimQuest}
            onUndo={onUndoQuest}
            enterOffset={3}
          />
        )}
        {/* Custom quests are independent of the fixed 5's "all done" state
            above — they stay visible either way, since allQuestsClaimed /
            DayCompleteCard are deliberately scoped to DAILY_QUESTS only.
            Same QuestCards component, so same picker and undo flow. */}
        <QuestCards
          quests={customClaimables}
          completedToday={hunter.completedToday}
          log={hunter.log}
          onClaim={claimCustom}
          onUndo={onUndoQuest}
          enterOffset={3 + DAILY_QUESTS.length}
        />
      </div>

      <button
        type="button"
        onClick={() => setLogSheetOpen(true)}
        aria-label="Log an activity"
        className="glow-accent fixed right-4 bottom-24 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#6fb4ff,var(--color-accent)_55%,var(--color-accent-active))] text-3xl leading-none font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-8px_rgb(0_0_0/0.7),0_0_var(--hud-glow-spread)_rgb(var(--glow)/0.6)] transition-transform active:scale-95"
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
