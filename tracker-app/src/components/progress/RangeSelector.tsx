import { cn } from '../../lib/cn'
import { RANGE_LABELS, type RangeKey } from '../../lib/progress'

const RANGES: RangeKey[] = ['week', 'month', 'year']

export interface RangeSelectorProps {
  value: RangeKey
  onChange: (range: RangeKey) => void
}

// Deliberately just Week/Month/Year for now — Last Week and a custom range
// are future options, not stubbed here as disabled buttons.
export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="inline-flex shrink-0 rounded-xl border border-border bg-surface-2 p-1">
      {RANGES.map((r) => {
        const active = value === r
        return (
          <button
            key={r}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(r)}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-colors',
              active
                ? 'bg-accent text-white shadow-glow-accent'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        )
      })}
    </div>
  )
}
