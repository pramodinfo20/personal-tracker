import { lazy, Suspense, useState } from 'react'
import { useHunter } from './hooks/useHunter'
import { BottomTabBar, type Tab } from './components/nav/BottomTabBar'
import { LevelUpScreen, MoreScreen, TodayScreen } from './components/screens'
import { GateClearedOverlay, LevelUpOverlay } from './components/hunter'
import { OnboardingFlow } from './components/onboarding'

// Code-split: recharts (Progress screen's chart library) is a meaningful
// chunk of weight that Today/Level Up/More never need — only load it once
// someone actually opens the Progress tab.
const ProgressScreen = lazy(() =>
  import('./components/screens/ProgressScreen').then((m) => ({ default: m.ProgressScreen })),
)

function App() {
  const [tab, setTab] = useState<Tab>('today')
  const {
    hunter,
    claimQuest,
    undoQuestClaim,
    logActivity,
    renameHunter,
    completeOnboarding,
    startGate,
    completeGateTask,
    handleGateExpire,
    levelUpEvent,
    dismissLevelUp,
    gateClearedEvent,
    dismissGateCleared,
  } = useHunter()

  // First launch only — hunter.name stays '' (the DEFAULT_HUNTER value)
  // until onboarding finishes, so this never reappears afterward.
  if (!hunter.name.trim()) {
    return <OnboardingFlow onComplete={completeOnboarding} />
  }

  return (
    <div className="bg-bg text-text-primary">
      {tab === 'today' && (
        <TodayScreen
          hunter={hunter}
          onClaimQuest={claimQuest}
          onUndoQuest={undoQuestClaim}
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
      {tab === 'progress' && (
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-bg text-sm font-bold text-text-muted">
              Loading…
            </div>
          }
        >
          <ProgressScreen hunter={hunter} />
        </Suspense>
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
