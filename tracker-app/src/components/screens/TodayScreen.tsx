import { useState } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import type { CustomQuest, CustomQuestTier } from '../../lib/customQuests'
import type { Hunter, StatKey } from '../../lib/hunterState'
import { allQuestsClaimed, type DailyQuest, type LogXPTier } from '../../lib/quests'
import {
  CustomQuestCards,
  DailyQuestCards,
  DayCompleteCard,
  GateBanner,
  HunterHeader,
  LogActivitySheet,
  QuestsResetTimer,
} from '../hunter'

export interface TodayScreenProps {
  hunter: Hunter
  customQuests: CustomQuest[]
  onClaimQuest: (quest: DailyQuest) => void
  onUndoQuest: (quest: DailyQuest) => UndoResult
  onClaimCustomQuest: (quest: CustomQuest, tier: CustomQuestTier) => void
  onUndoCustomQuest: (quest: CustomQuest) => UndoResult
  onLogActivity: (tier: LogXPTier, label: string, stat: StatKey) => void
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
  onUndoQuest,
  onClaimCustomQuest,
  onUndoCustomQuest,
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

  return (
    <div className="min-h-dvh bg-bg pb-28 text-text-primary">
      <HunterHeader hunter={hunter} />

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 sm:px-6">
        <GateBanner
          hunter={hunter}
          onStartGate={onStartGate}
          onCompleteTask={onCompleteGateTask}
          onGateExpire={onGateExpire}
        />
        <QuestsResetTimer />
        {allDone && !showQuestsAnyway ? (
          <DayCompleteCard streak={hunter.streak} onEditClaims={() => setShowQuestsAnyway(true)} />
        ) : (
          <DailyQuestCards
            completedToday={hunter.completedToday}
            onClaim={onClaimQuest}
            onUndo={onUndoQuest}
          />
        )}
        {/* Custom quests are independent of the fixed 5's "all done" state
            above — they stay visible either way, since allQuestsClaimed /
            DayCompleteCard are deliberately scoped to DAILY_QUESTS only. */}
        <CustomQuestCards
          quests={customQuests}
          completedToday={hunter.completedToday}
          log={hunter.log}
          onClaim={onClaimCustomQuest}
          onUndo={onUndoCustomQuest}
        />
      </div>

      <button
        type="button"
        onClick={() => setLogSheetOpen(true)}
        aria-label="Log an activity"
        className="fixed right-4 bottom-24 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent text-3xl leading-none font-bold text-white shadow-glow-accent transition-transform active:scale-95"
      >
        +
      </button>

      {logSheetOpen && (
        <LogActivitySheet
          logCount={hunter.logCount}
          onLog={onLogActivity}
          onClose={() => setLogSheetOpen(false)}
        />
      )}
    </div>
  )
}
