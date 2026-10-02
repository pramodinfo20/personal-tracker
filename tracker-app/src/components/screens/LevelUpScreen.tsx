import type { NewCustomQuest } from '../../hooks/useCustomQuests'
import type { CustomQuest } from '../../lib/customQuests'
import type { Hunter } from '../../lib/hunterState'
import {
  GateCard,
  HunterStatusPanel,
  MyQuestsSection,
  RecentActivityLog,
  ShadowArmyGrid,
} from '../hunter'

export interface LevelUpScreenProps {
  hunter: Hunter
  customQuests: CustomQuest[]
  onRename: (name: string) => void
  onStartGate: () => void
  onCompleteGateTask: (taskId: string) => void
  onGateExpire: () => void
  onAddCustomQuest: (quest: NewCustomQuest) => void
  onUpdateCustomQuest: (id: string, patch: NewCustomQuest) => void
  onSetCustomQuestActive: (id: string, active: boolean) => void
  onDeleteCustomQuest: (id: string) => void
}

// The full Hunter Status detail view — stats, shadow army, gate management,
// quest management, and activity history. Reachable via the bottom tab bar,
// no longer the app's default screen (that's Today now).
export function LevelUpScreen({
  hunter,
  customQuests,
  onRename,
  onStartGate,
  onCompleteGateTask,
  onGateExpire,
  onAddCustomQuest,
  onUpdateCustomQuest,
  onSetCustomQuestActive,
  onDeleteCustomQuest,
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
        <MyQuestsSection
          customQuests={customQuests}
          completedToday={hunter.completedToday}
          onAdd={onAddCustomQuest}
          onUpdate={onUpdateCustomQuest}
          onSetActive={onSetCustomQuestActive}
          onDelete={onDeleteCustomQuest}
        />
        <RecentActivityLog log={hunter.log} />
      </div>
    </div>
  )
}
