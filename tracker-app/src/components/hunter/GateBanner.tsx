import { useState, type CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import { deriveGateState } from '../../lib/gateState'
import { resolveGateBonusXP } from '../../lib/gates'
import type { Hunter } from '../../lib/hunterState'
import { Badge, Button, CountdownTimer, TIER_CLASSES } from '../ui'
import { gateTierColor } from './tierMapping'

export interface GateBannerProps {
  hunter: Hunter
  onStartGate: () => void
  onCompleteTask: (taskId: string) => void
  onGateExpire: () => void
}

// Under an hour remaining flips the banner into its most attention-grabbing
// state — this is deliberately a much wider window than CountdownTimer's own
// 60s "about to expire" pulse, which is for the small inline badge, not a
// whole-banner treatment.
const URGENT_MS = 60 * 60 * 1000

const URGENT_PULSE_STYLE: CSSProperties = {
  '--pulse-ring': 'rgba(224, 41, 63, 0.45)',
  '--pulse-ring-strong': 'rgba(224, 41, 63, 0.65)',
  '--pulse-glow': 'rgba(224, 41, 63, 0.4)',
  '--pulse-glow-strong': 'rgba(224, 41, 63, 0.8)',
} as CSSProperties

// Prominent, "impossible to miss" gate summary for the Today screen — fully
// actionable (Start / Complete task) without navigating to the Level Up tab.
// The Level Up tab's GateCard covers the same data with more detail (plus
// cleared-gates history) for players who want it.
export function GateBanner({ hunter, onStartGate, onCompleteTask, onGateExpire }: GateBannerProps) {
  const { activeGate, activeTemplate, availableGate } = deriveGateState(hunter)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  if (!activeGate && !availableGate) return null

  if (activeGate && activeTemplate) {
    const tier = gateTierColor(activeGate.tier)
    const urgent = remainingMs !== null && remainingMs < URGENT_MS
    const doneCount = activeTemplate.tasks.filter((t) => activeGate.completedTasks?.[t.id]).length

    return (
      <div
        className={cn(
          'rounded-2xl border-2 p-4 transition-colors duration-500',
          urgent
            ? 'animate-glow-pulse border-tier-red/70 bg-tier-red/10'
            : cn(TIER_CLASSES[tier].border, TIER_CLASSES[tier].bg),
        )}
        style={urgent ? URGENT_PULSE_STYLE : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tier={urgent ? 'red' : tier}>
              {activeGate.tier}-Rank · {activeGate.name}
            </Badge>
            <div className="mt-1.5 text-xs text-text-secondary">
              {doneCount}/{activeTemplate.tasks.length} tasks done · +
              {resolveGateBonusXP(activeTemplate)} XP
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-[10px] font-bold tracking-wide text-text-secondary uppercase">
              Closes in
            </div>
            <CountdownTimer
              expiresAt={activeGate.expiresAt}
              onExpire={onGateExpire}
              onTick={setRemainingMs}
              className="text-base"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {activeTemplate.tasks.map((t) => {
            const done = !!activeGate.completedTasks?.[t.id]
            return (
              <button
                key={t.id}
                type="button"
                disabled={done}
                onClick={() => onCompleteTask(t.id)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors',
                  done
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'cursor-pointer border-border-strong bg-surface-2 text-text-primary hover:border-accent/60',
                )}
              >
                <span>
                  {done ? '☑' : '☐'} {t.label}
                </span>
                <span className="shrink-0 text-xs font-bold text-text-secondary">+{t.xp}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const gate = availableGate!
  const tier = gateTierColor(gate.tier)
  return (
    <div className={cn('rounded-2xl border-2 p-4', TIER_CLASSES[tier].border, TIER_CLASSES[tier].bg)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tier={tier}>
            {gate.tier}-Rank · {gate.name}
          </Badge>
          <div className="mt-1.5 text-xs text-text-secondary">
            {gate.tasks.length} tasks · {gate.duration_hours}h to clear · +
            {resolveGateBonusXP(gate)} XP bonus
          </div>
        </div>
        <Button onClick={onStartGate} className="shrink-0">
          Start Gate
        </Button>
      </div>
    </div>
  )
}
