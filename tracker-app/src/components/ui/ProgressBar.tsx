import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ProgressBarSize = 'default' | 'thin' | 'hero'

export interface ProgressBarProps {
  value: number
  max: number
  /** Override the label under the bar; defaults to "value/max". Pass null to hide it. */
  label?: ReactNode
  /** 'thin' for a slim header-strip bar with no room for a label. */
  size?: ProgressBarSize
  className?: string
}

const TRACK_HEIGHT: Record<ProgressBarSize, string> = {
  default: 'h-3',
  thin: 'h-1.5',
  hero: 'h-3.5',
}

// The fill is .hud-bar-fill (index.css): it blooms in --glow — inherited
// from the nearest .glow-* ancestor, accent blue by default — and sweeps a
// one-shot sheen across on mount.

export function ProgressBar({ value, max, label, size = 'default', className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const displayLabel = label === null ? null : (label ?? `${value}/${max}`)

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative w-full rounded-full border border-hairline bg-track shadow-[inset_0_1px_2px_rgb(var(--rgb-shadow)/0.35)]',
          TRACK_HEIGHT[size],
        )}
      >
        <div
          className="hud-bar-fill h-full rounded-full transition-[width] duration-500 ease-out"
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
