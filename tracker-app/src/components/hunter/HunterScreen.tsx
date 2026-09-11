import { useHunter } from '../../hooks/useHunter'
import { DailyQuestList } from './DailyQuestList'
import { GateCard } from './GateCard'
import { GateClearedOverlay } from './GateClearedOverlay'
import { HunterStatusPanel } from './HunterStatusPanel'
import { LevelUpOverlay } from './LevelUpOverlay'
import { LogActivityForm } from './LogActivityForm'
import { RecentActivityLog } from './RecentActivityLog'
import { ShadowArmyGrid } from './ShadowArmyGrid'

export function HunterScreen() {
  const {
    hunter,
    claimQuest,
    logActivity,
    allocateStat,
    renameHunter,
    startGate,
    completeGateTask,
    handleGateExpire,
    levelUpEvent,
    dismissLevelUp,
    gateClearedEvent,
    dismissGateCleared,
  } = useHunter()

  return (
    <div className="min-h-screen bg-bg px-4 py-6 text-text-primary sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <HunterStatusPanel hunter={hunter} onAllocateStat={allocateStat} onRename={renameHunter} />
        <ShadowArmyGrid unlockedShadows={hunter.unlockedShadows} />
        <GateCard
          hunter={hunter}
          onStartGate={startGate}
          onCompleteTask={completeGateTask}
          onGateExpire={handleGateExpire}
        />
        <DailyQuestList completedToday={hunter.completedToday} onClaim={claimQuest} />
        <LogActivityForm logCount={hunter.logCount} onLog={logActivity} />
        <RecentActivityLog log={hunter.log} />
      </div>

      {levelUpEvent && <LevelUpOverlay event={levelUpEvent} onDismiss={dismissLevelUp} />}
      {gateClearedEvent && (
        <GateClearedOverlay event={gateClearedEvent} onDismiss={dismissGateCleared} />
      )}
    </div>
  )
}
