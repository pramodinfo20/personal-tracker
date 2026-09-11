import type { Hunter } from '../../lib/hunterState'
import { GateCard, HunterStatusPanel, RecentActivityLog, ShadowArmyGrid } from '../hunter'

export interface LevelUpScreenProps {
  hunter: Hunter
  onRename: (name: string) => void
  onStartGate: () => void
  onCompleteGateTask: (taskId: string) => void
  onGateExpire: () => void
}

// The full Hunter Status detail view — stats, shadow army, gate management,
// and activity history. Reachable via the bottom tab bar, no longer the
// app's default screen (that's Today now).
export function LevelUpScreen({
  hunter,
  onRename,
  onStartGate,
  onCompleteGateTask,
  onGateExpire,
}: LevelUpScreenProps) {
  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <HunterStatusPanel hunter={hunter} onRename={onRename} />
        <ShadowArmyGrid unlockedShadows={hunter.unlockedShadows} />
        <GateCard
          hunter={hunter}
          onStartGate={onStartGate}
          onCompleteTask={onCompleteGateTask}
          onGateExpire={onGateExpire}
        />
        <RecentActivityLog log={hunter.log} />
      </div>
    </div>
  )
}
