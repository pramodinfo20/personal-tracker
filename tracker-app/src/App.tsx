import { lazy, Suspense, useCallback, useState } from 'react'
import { useCustomQuests } from './hooks/useCustomQuests'
import { useGoals } from './hooks/useGoals'
import { useHunter } from './hooks/useHunter'
import { useJobApplications } from './hooks/useJobApplications'
import { useTracker } from './hooks/useTracker'
import { ThemeProvider } from './hooks/useTheme'
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
import { HUNT_QUEST_ID, huntQuest } from './lib/jobApplications'
import { CERTS, PROJECTS, SKILLS } from './lib/trackers'
import { starterActivitiesForGoals, type OnboardingResult } from './lib/onboarding'
import { questEntries } from './lib/questVisibility'

// Code-split: recharts (Progress screen's chart library) is a meaningful
// chunk of weight that Today/Level Up/More never need — only load it once
// someone actually opens the Progress tab.
const ProgressScreen = lazy(() =>
  import('./components/screens/ProgressScreen').then((m) => ({ default: m.ProgressScreen })),
)

function AppShell() {
  const [tab, setTab] = useState<Tab>('today')
  const [profileOpen, setProfileOpen] = useState(false)
  const [manageQuestsOpen, setManageQuestsOpen] = useState(false)
  const [retakeSetupOpen, setRetakeSetupOpen] = useState(false)
  // The welcome banner on Today — only after FIRST-launch setup, and only
  // in memory, so it's shown once and never again after a reload.
  const [welcome, setWelcome] = useState(false)
  const dismissWelcome = useCallback(() => setWelcome(false), [])
  const {
    hunter,
    dev,
    claimQuest,
    undoQuestClaim,
    undoLogActivity,
    summon,
    setFixedQuestEnabled,
    claimCustomQuest,
    logActivity,
    renameHunter,
    relabelQuestEntries,
    setPhoto,
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
  const { applications, addApplication, updateApplication, deleteApplication } = useJobApplications()
  const { goals, addGoal, updateGoal, setGoalStatus, deleteGoal } = useGoals()
  const trackers = { skills: useTracker(SKILLS), certs: useTracker(CERTS), projects: useTracker(PROJECTS) }

  // Renaming a custom quest: the quest itself, and its claims already in
  // the activity log, so the new name shows everywhere at once.
  const renameCustomQuest = (id: string, name: string) => {
    renameQuest(id, name)
    relabelQuestEntries(id, name)
  }

  // Setup's goals also seed starter quests for goals that have no built-in
  // quest behind them (e.g. Hydration -> Drinking Water) — through the
  // normal add-quest path, and never a second copy of one already there.
  const finishSetup = (result: OnboardingResult) => {
    completeOnboarding(result)
    for (const activityId of starterActivitiesForGoals(result.goals)) {
      if (!customQuests.some((q) => q.activityId === activityId)) addQuest(activityId)
    }
    if (!retakeSetupOpen) {
      setWelcome(true)
      setTab('today')
    }
    setRetakeSetupOpen(false)
  }

  // First launch only — hunter.name stays '' (the DEFAULT_HUNTER value)
  // until setup finishes (the name is required there), so an existing save
  // never lands here and setup never reappears on its own afterward.
  if (!hunter.name.trim()) {
    return <OnboardingFlow onComplete={finishSetup} />
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
          showWelcome={welcome}
          onDismissWelcome={dismissWelcome}
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
          onUndoActivity={undoLogActivity}
          onSummon={summon}
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
      {tab === 'more' && (
        <MoreScreen
          trackers={trackers}
          calendar={{ dailyXP: hunter.dailyXP ?? {}, dailyStatXP: hunter.dailyStatXP }}
          goals={{
            goals,
            onAdd: addGoal,
            onUpdate: updateGoal,
            onSetStatus: setGoalStatus,
            onDelete: deleteGoal,
          }}
          jobSearch={{
            applications,
            onAdd: addApplication,
            onUpdate: updateApplication,
            onDelete: deleteApplication,
            huntClaimedToday: Boolean(hunter.completedToday?.[HUNT_QUEST_ID]),
            // The ordinary quest claim — same path as tapping the card on Today.
            onClaimHunt: (tier) => claimQuest(huntQuest(), tier),
          }}
        />
      )}

      <BottomTabBar active={tab} onChange={setTab} />

      {profileOpen && (
        <ProfileSheet
          hunter={hunter}
          onRename={renameHunter}
          onSetPhoto={setPhoto}
          dev={dev}
          onManageQuests={() => {
            setProfileOpen(false)
            setManageQuestsOpen(true)
          }}
          onRetakeSetup={() => {
            setProfileOpen(false)
            setRetakeSetupOpen(true)
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
          onRename={renameCustomQuest}
          onDelete={deleteQuest}
          onClose={() => setManageQuestsOpen(false)}
        />
      )}

      {retakeSetupOpen && (
        <OnboardingFlow
          initial={{
            name: hunter.name,
            age: hunter.age,
            heightCm: hunter.heightCm,
            weightKg: hunter.weightKg,
            goals: hunter.goals ?? [],
          }}
          onComplete={finishSetup}
          onCancel={() => setRetakeSetupOpen(false)}
        />
      )}

      {levelUpEvent && <LevelUpOverlay event={levelUpEvent} onDismiss={dismissLevelUp} />}
      {gateClearedEvent && (
        <GateClearedOverlay event={gateClearedEvent} onDismiss={dismissGateCleared} />
      )}
    </div>
  )
}

// The provider lives here (not in main.tsx) so anything rendering <App />
// — including tests — gets working theme state.
function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}

export default App
