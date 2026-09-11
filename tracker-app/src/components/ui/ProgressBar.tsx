import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface ProgressBarProps {
  value: number
  max: number
  /** Override the label under the bar; defaults to "value/max". Pass null to hide it. */
  label?: ReactNode
  className?: string
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const displayLabel = label === null ? null : (label ?? `${value}/${max}`)

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-border bg-surface-2">
        <div
          className="h-full rounded-full bg-[length:200px_100%] bg-gradient-to-r from-accent-active via-accent to-accent-hover transition-[width] duration-500 ease-out animate-shimmer"
          style={{ width: `${pct}%` }}
        />
      </div>
      {displayLabel !== null && (
        <div className="mt-1 text-right font-mono text-xs text-text-secondary">
          {displayLabel}
        </div>
      )}
    </div>
  )
}
