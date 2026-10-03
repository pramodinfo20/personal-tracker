import { lazy, Suspense, useState } from 'react'
import { useCustomQuests } from './hooks/useCustomQuests'
import { useHunter } from './hooks/useHunter'
import { BottomTabBar, type Tab } from './components/nav/BottomTabBar'
import { LevelUpScreen, MoreScreen, TodayScreen } from './components/screens'
import {
  GateClearedOverlay,
  HunterHeader,
  LevelUpOverlay,
  ManageQuestsSheet,
  ProfileSheet,
} from './components/hunter'
import { OnboardingFlow } from './components/onboarding'
import { questEntries } from './lib/questVisibility'

// Code-split: recharts (Progress screen's chart library) is a meaningful
// chunk of weight that Today/Level Up/More never need — only load it once
// someone actually opens the Progress tab.
const ProgressScreen = lazy(() =>
  import('./components/screens/ProgressScreen').then((m) => ({ default: m.ProgressScreen })),
)

function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [profileOpen, setProfileOpen] = useState(false)
  const [manageQuestsOpen, setManageQuestsOpen] = useState(false)
  const {
    hunter,
    dev,
    claimQuest,
    undoQuestClaim,
    setFixedQuestEnabled,
    claimCustomQuest,
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
  const { customQuests, addQuest, renameQuest, setQuestActive, deleteQuest } = useCustomQuests()

  // First launch only — hunter.name stays '' (the DEFAULT_HUNTER value)
  // until onboarding finishes, so this never reappears afterward.
  if (!hunter.name.trim()) {
    return <OnboardingFlow onComplete={completeOnboarding} />
  }

  return (
    <div className="bg-bg text-text-primary">
      {/* Persistent across every tab — the avatar here is the Profile entry point. */}
      <HunterHeader
        hunter={hunter}
        onOpenProfile={() => setProfileOpen(true)}
        // Today's HunterHeroPanel shows level/rank/XP large — don't repeat it.
        showProgress={tab !== 'today'}
      />

      {tab === 'today' && (
        <TodayScreen
          hunter={hunter}
          customQuests={customQuests}
          onClaimQuest={claimQuest}
          onUndoQuest={undoQuestClaim}
          onClaimCustomQuest={claimCustomQuest}
          onLogActivity={logActivity}
          onManageQuests={() => setManageQuestsOpen(true)}
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
          onManageQuests={() => setManageQuestsOpen(true)}
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

      {profileOpen && (
        <ProfileSheet
          hunter={hunter}
          onRename={renameHunter}
          dev={dev}
          onManageQuests={() => {
            setProfileOpen(false)
            setManageQuestsOpen(true)
          }}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {manageQuestsOpen && (
        <ManageQuestsSheet
          entries={questEntries(hunter.hiddenQuestIds, customQuests)}
          completedToday={hunter.completedToday}
          // One toggle for both kinds; only where the flag is stored differs.
          onSetEnabled={(entry, enabled) =>
            entry.kind === 'fixed'
              ? setFixedQuestEnabled(entry.quest.id, enabled)
              : setQuestActive(entry.quest.id, enabled)
          }
          onAdd={addQuest}
          onRename={renameQuest}
          onDelete={deleteQuest}
          onClose={() => setManageQuestsOpen(false)}
        />
      )}

      {levelUpEvent && <LevelUpOverlay event={levelUpEvent} onDismiss={dismissLevelUp} />}
      {gateClearedEvent && (
        <GateClearedOverlay event={gateClearedEvent} onDismiss={dismissGateCleared} />
      )}
    </div>
  )
}

export default App
