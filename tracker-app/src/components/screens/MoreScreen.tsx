import { useState } from 'react'
import { CalendarScreen, type CalendarScreenProps } from '../calendar/CalendarScreen'
import { GoalsScreen, type GoalsScreenProps } from '../goals/GoalsScreen'
import { JobSearchScreen, type JobSearchScreenProps } from '../jobs/JobSearchScreen'
import type { TrackerList } from '../../hooks/useTracker'
import { TRACKERS, type TrackerDef } from '../../lib/trackers'
import { TrackerScreen } from '../trackers/TrackerScreen'
import { ScreenBackground } from '../ui'

export interface MoreScreenProps {
  /** Everything the Job Search tracker needs (it opens inside this tab). */
  jobSearch: Omit<JobSearchScreenProps, 'onBack'>
  goals: Omit<GoalsScreenProps, 'onBack'>
  /** The saved list for each simple tracker (Skills, Certs, Projects). */
  trackers: Record<TrackerDef['id'], TrackerList>
  /** The XP history the Calendar heatmap is drawn from. */
  calendar: Omit<CalendarScreenProps, 'onBack'>
}

type View = 'menu' | 'jobs' | 'goals' | 'calendar' | TrackerDef['id']

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

// Houses everything that isn't part of the core Today / Level Up loop.
// Every row opens its screen inside this tab.
export function MoreScreen({ jobSearch, goals, trackers, calendar }: MoreScreenProps) {
  const [view, setView] = useState<View>('menu')

  if (view === 'jobs') {
    return <JobSearchScreen {...jobSearch} onBack={() => setView('menu')} />
  }

  if (view === 'goals') {
    return <GoalsScreen {...goals} onBack={() => setView('menu')} />
  }

  if (view === 'calendar') {
    return <CalendarScreen {...calendar} onBack={() => setView('menu')} />
  }

  const openTracker = TRACKERS.find((t) => t.id === view)
  if (openTracker) {
    return (
      <TrackerScreen
        key={openTracker.id}
        def={openTracker}
        list={trackers[openTracker.id]}
        onBack={() => setView('menu')}
      />
    )
  }

  const active = goals.goals.filter((g) => g.status !== 'done').length
  const rows: { view: View; icon: string; label: string; note: string }[] = [
    {
      view: 'goals',
      icon: '🎯',
      label: 'Goals',
      note: goals.goals.length > 0 ? `${active} active` : '',
    },
    {
      view: 'jobs',
      icon: '💼',
      label: 'Job Search',
      note: jobSearch.applications.length > 0 ? plural(jobSearch.applications.length, 'application') : '',
    },
    ...TRACKERS.map((t) => {
      const n = trackers[t.id].items.length
      return { view: t.id, icon: t.icon, label: t.title, note: n > 0 ? `${n} ${n === 1 ? t.singular : t.plural}` : '' }
    }),
    { view: 'calendar', icon: '🗓️', label: 'Calendar', note: '' },
  ]

  return (
    <ScreenBackground
      screen="generic"
      className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10"
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-extrabold text-text-primary">More</h1>
        <p className="mt-1 mb-6 text-sm text-text-primary/80">
          Track the real-life progress that supports your Hunter journey.
        </p>
        <div className="hud-glass divide-y divide-hairline overflow-hidden rounded-2xl">
          {rows.map((t) => (
            <button
              key={t.view}
              type="button"
              onClick={() => setView(t.view)}
              className="hud-pressable flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-text-primary">
                <span className="text-lg" aria-hidden="true">
                  {t.icon}
                </span>
                {t.label}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-text-secondary">
                {t.note}
                <span className="text-xl" aria-hidden="true">
                  ›
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </ScreenBackground>
  )
}
