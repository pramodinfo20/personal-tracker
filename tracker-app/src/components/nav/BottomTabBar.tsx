import { cn } from '../../lib/cn'

export type Tab = 'today' | 'levelup' | 'more'

export interface BottomTabBarProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'levelup', label: 'Level Up', icon: '⚔️' },
  { id: 'more', label: 'More', icon: '☰' },
]

// Fixed, thumb-reachable bottom navigation — the mobile-first replacement
// for a top tab bar. pb-[env(safe-area-inset-bottom)] keeps it clear of the
// home-indicator area on notched phones.
export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-elevated/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors',
                isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <span
                className={cn(
                  'text-xl leading-none',
                  isActive && 'drop-shadow-[0_0_8px_rgba(47,143,255,0.6)]',
                )}
                aria-hidden="true"
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
