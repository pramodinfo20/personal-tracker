import { useState } from 'react'
import { useHunter } from './hooks/useHunter'
import { BottomTabBar, type Tab } from './components/nav/BottomTabBar'
import { LevelUpScreen, MoreScreen, TodayScreen } from './components/screens'
import { GateClearedOverlay, LevelUpOverlay } from './components/hunter'

function App() {
  const [tab, setTab] = useState<Tab>('today')
  const {
    hunter,
    claimQuest,
    logActivity,
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
    <div className="bg-bg text-text-primary">
      {tab === 'today' && (
        <TodayScreen
          hunter={hunter}
          onClaimQuest={claimQuest}
          onLogActivity={logActivity}
          onStartGate={startGate}
          onCompleteGateTask={completeGateTask}
          onGateExpire={handleGateExpire}
        />
      )}
      {tab === 'levelup' && (
        <LevelUpScreen
          hunter={hunter}
          onRename={renameHunter}
          onStartGate={startGate}
          onCompleteGateTask={completeGateTask}
          onGateExpire={handleGateExpire}
        />
      )}
      {tab === 'more' && <MoreScreen />}

      <BottomTabBar active={tab} onChange={setTab} />

      {levelUpEvent && <LevelUpOverlay event={levelUpEvent} onDismiss={dismissLevelUp} />}
      {gateClearedEvent && (
        <GateClearedOverlay event={gateClearedEvent} onDismiss={dismissGateCleared} />
      )}
    </div>
  )
}

export default App
