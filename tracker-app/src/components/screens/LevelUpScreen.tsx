import type { SummonResult, UndoResult } from '../../hooks/useHunter'
import type { Hunter } from '../../lib/hunterState'
import { ticketState } from '../../lib/lottery'
import {
  GateCard,
  HunterStatusPanel,
  RecentActivityLog,
  MonsterCompanionsGrid,
} from '../hunter'
import { ScreenBackground } from '../ui'

export interface LevelUpScreenProps {
  hunter: Hunter
  onRename: (name: string) => void
  onStartGate: () => void
  onCompleteGateTask: (taskId: string) => void
  onGateExpire: () => void
  onManageQuests: () => void
  onUndoActivity: (entryId: number) => UndoResult
  /** Spend a ticket on a companion draw (useHunter's summon). */
  onSummon: () => SummonResult | null
}

// The full Hunter Status detail view — stats, monster companions, gate management,
// quest management, and activity history. Reachable via the bottom tab bar,
// no longer the app's default screen (that's Today now).
export function LevelUpScreen({
  hunter,
  onRename,
  onStartGate,
  onCompleteGateTask,
  onGateExpire,
  onManageQuests,
  onUndoActivity,
  onSummon,
}: LevelUpScreenProps) {
  return (
    // The gate backdrop — this tab is where gates are started and cleared.
    <ScreenBackground
      screen="gate"
      className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <HunterStatusPanel hunter={hunter} onRename={onRename} />
        <MonsterCompanionsGrid
          level={hunter.level || 1}
          unlockedMilestones={hunter.unlockedShadows ?? []}
          recruited={hunter.recruitedCompanions}
          tickets={ticketState(hunter)}
          echoShards={hunter.echoShards ?? 0}
          onSummon={onSummon}
        />
        <GateCard
          hunter={hunter}
          onStartGate={onStartGate}
          onCompleteTask={onCompleteGateTask}
          onGateExpire={onGateExpire}
        />
        {/* Quest management moved to the Manage Quests screen (also in
            Profile) — this keeps a way in from where it used to live. */}
        <button
          type="button"
          onClick={onManageQuests}
          className="hud-glass hud-pressable flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-4 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="hud-icon h-10 w-10 text-xl" aria-hidden="true">
              🗒️
            </span>
            <span>
              <span className="block text-sm font-bold text-text-primary">Manage Quests</span>
              <span className="block text-xs text-text-secondary">
                Choose what shows on Today, add or rename your own
              </span>
            </span>
          </span>
          <span className="text-xl text-text-secondary" aria-hidden="true">
            ›
          </span>
        </button>
        <RecentActivityLog log={hunter.log} onUndoActivity={onUndoActivity} />
      </div>
    </ScreenBackground>
  )
}
