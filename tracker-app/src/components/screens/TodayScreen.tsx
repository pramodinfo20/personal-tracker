import { useState } from 'react'
import type { Hunter, StatKey } from '../../lib/hunterState'
import { allQuestsClaimed, type DailyQuest, type LogXPTier } from '../../lib/quests'
import {
  DailyQuestCards,
  DayCompleteCard,
  GateBanner,
  HunterHeader,
  LogActivitySheet,
  QuestsResetTimer,
} from '../hunter'

export interface TodayScreenProps {
  hunter: Hunter
  onClaimQuest: (quest: DailyQuest) => void
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
  onClaimQuest,
  onLogActivity,
  onStartGate,
  onCompleteGateTask,
  onGateExpire,
}: TodayScreenProps) {
  const [logSheetOpen, setLogSheetOpen] = useState(false)

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
        {allQuestsClaimed(hunter.completedToday) ? (
          <DayCompleteCard streak={hunter.streak} />
        ) : (
          <DailyQuestCards completedToday={hunter.completedToday} onClaim={onClaimQuest} />
        )}
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
