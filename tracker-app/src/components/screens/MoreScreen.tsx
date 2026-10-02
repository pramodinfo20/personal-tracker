import { screenBackgroundProps } from '../../lib/screenBackgrounds'
import { ScreenBackground } from '../ui'

const MORE_ITEMS = [
  { icon: '🎯', label: 'Goals' },
  { icon: '🧠', label: 'Skills' },
  { icon: '📊', label: 'Calendar' },
  { icon: '📜', label: 'Certs' },
  { icon: '🛠️', label: 'Projects' },
  { icon: '✈️', label: 'Travel' },
  { icon: '💼', label: 'Job Search' },
]

// Houses everything that isn't part of the core Today / Level Up loop.
// None of these trackers have been rebuilt yet in this app (only the
// hunter/gamification system has), so they're listed as coming soon rather
// than linking to screens that don't exist.
export function MoreScreen() {
  return (
    <ScreenBackground
      {...screenBackgroundProps('generic')}
      className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10"
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-extrabold text-text-primary">More</h1>
        <p className="mt-1 mb-6 text-sm text-text-primary/80">
          Other trackers live here as they're rebuilt.
        </p>
        <div className="hud-glass divide-y divide-white/5 overflow-hidden rounded-2xl">
          {MORE_ITEMS.map((item) => (
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
              <span className="shrink-0 rounded-full border border-border bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-text-secondary uppercase">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </ScreenBackground>
  )
}
