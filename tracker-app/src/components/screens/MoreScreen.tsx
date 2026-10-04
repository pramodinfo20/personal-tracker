import { useState } from 'react'
import { GoalsScreen, type GoalsScreenProps } from '../goals/GoalsScreen'
import { JobSearchScreen, type JobSearchScreenProps } from '../jobs/JobSearchScreen'
import { ScreenBackground } from '../ui'

// Trackers that haven't been rebuilt in this app yet.
const COMING_SOON = [
  { icon: '🧠', label: 'Skills' },
  { icon: '📊', label: 'Calendar' },
  { icon: '📜', label: 'Certs' },
  { icon: '🛠️', label: 'Projects' },
  { icon: '✈️', label: 'Travel' },
]

export interface MoreScreenProps {
  /** Everything the Job Search tracker needs (it opens inside this tab). */
  jobSearch: Omit<JobSearchScreenProps, 'onBack'>
  goals: Omit<GoalsScreenProps, 'onBack'>
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

// Houses everything that isn't part of the core Today / Level Up loop.
// Goals and Job Search are built and open from here; the rest are listed as coming
// soon rather than linking to screens that don't exist.
export function MoreScreen({ jobSearch, goals }: MoreScreenProps) {
  const [view, setView] = useState<'menu' | 'jobs' | 'goals'>('menu')

  if (view === 'jobs') {
    return <JobSearchScreen {...jobSearch} onBack={() => setView('menu')} />
  }

  if (view === 'goals') {
    return <GoalsScreen {...goals} onBack={() => setView('menu')} />
  }

  // The trackers that are built: each row opens its screen inside this tab.
  const active = goals.goals.filter((g) => g.status !== 'done').length
  const trackers = [
    {
      view: 'goals' as const,
      icon: '🎯',
      label: 'Goals',
      note: goals.goals.length > 0 ? `${active} active` : '',
    },
    {
      view: 'jobs' as const,
      icon: '💼',
      label: 'Job Search',
      note: jobSearch.applications.length > 0 ? plural(jobSearch.applications.length, 'application') : '',
    },
  ]

  return (
    <ScreenBackground
      screen="generic"
      className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10"
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-extrabold text-text-primary">More</h1>
        <p className="mt-1 mb-6 text-sm text-text-primary/80">
          Other trackers live here as they're rebuilt.
        </p>
        <div className="hud-glass divide-y divide-hairline overflow-hidden rounded-2xl">
          {trackers.map((t) => (
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
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              {/* Only the not-yet-built item itself is faded — the badge stays fully legible. */}
              <span className="flex items-center gap-3 text-sm font-bold text-text-primary opacity-60">
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </span>
              <span className="shrink-0 rounded-full border border-border bg-backing/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-text-secondary uppercase">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </ScreenBackground>
  )
}
