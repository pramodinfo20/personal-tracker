import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import { formatCountdown } from '../../lib/format'

export interface CountdownTimerProps {
  /** Timestamp (ms) the countdown ends at — e.g. an ActiveGate's expiresAt. */
  expiresAt: number
  /** Fired once, the first tick remaining time hits zero. */
  onExpire?: () => void
  /** Fired every second with the current remaining ms — for callers that need to react to the countdown themselves (e.g. changing their own layout once under an hour remains). */
  onTick?: (remainingMs: number) => void
  /** Below this many ms remaining, the timer switches to an urgent pulsing red. */
  urgentThresholdMs?: number
  className?: string
}

const URGENT_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(224, 41, 63, 0.4)',
  '--pulse-ring-strong': 'rgba(224, 41, 63, 0.6)',
  '--pulse-glow': 'rgba(224, 41, 63, 0.4)',
  '--pulse-glow-strong': 'rgba(224, 41, 63, 0.75)',
} as CSSProperties

export function CountdownTimer({
  expiresAt,
  onExpire,
  onTick,
  urgentThresholdMs = 60_000,
  className,
}: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const remaining = Math.max(0, expiresAt - now)
  const expired = remaining <= 0
  const urgent = !expired && remaining <= urgentThresholdMs

  useEffect(() => {
    if (expired && !firedRef.current) {
      firedRef.current = true
      onExpire?.()
    }
  }, [expired, onExpire])

  useEffect(() => {
    onTick?.(remaining)
    // Only the remaining value (derived from `now`) should re-trigger this — onTick
    // is expected to be a fresh closure on every render, not a stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-sm tracking-wider tabular-nums',
        expired
          ? 'border-border text-text-muted'
          : urgent
            ? 'border-tier-red/50 text-tier-red animate-glow-pulse'
            : 'border-border-strong text-accent',
        className,
      )}
      style={urgent ? URGENT_PULSE_STYLE : undefined}
    >
      {formatCountdown(remaining)}
    </span>
  )
}
