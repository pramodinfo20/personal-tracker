import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/cn'
import { THEME_PREFERENCES, type ThemePreference } from '../../lib/theme'

const LABELS: Record<ThemePreference, { label: string; icon: string }> = {
  system: { label: 'System', icon: '🖥️' },
  light: { label: 'Light', icon: '☀️' },
  dark: { label: 'Dark', icon: '🌙' },
}

// Three-way appearance control: follow the system, or force light / dark.
// Reads and writes the saved preference through useTheme; the choice
// applies immediately and survives reloads.
export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme()

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="hud-inset inline-flex w-full rounded-xl p-1"
      >
        {THEME_PREFERENCES.map((option) => {
          const selected = option === preference
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(option)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors',
                selected
                  ? 'bg-accent-solid text-on-accent shadow-glow-accent'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <span aria-hidden="true">{LABELS[option].icon}</span>
              {LABELS[option].label}
            </button>
          )
        })}
      </div>
      {preference === 'system' && (
        <p className="mt-1.5 text-[11px] text-text-muted">
          Following your device — currently {resolved}.
        </p>
      )}
    </div>
  )
}
