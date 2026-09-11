import { cn } from '../../lib/cn'
import {
  GATE_TEMPLATES,
  checkGateUnlock,
  resolveGateBonusXP,
  type ActiveGate,
  type GateTemplate,
} from '../../lib/gates'
import { STAT_META, type Hunter } from '../../lib/hunterState'
import { Badge, Button, Card, CountdownTimer, TIER_CLASSES } from '../ui'
import { gateTierColor } from './tierMapping'

export interface GateCardProps {
  hunter: Hunter
  onStartGate: () => void
  onCompleteTask: (taskId: string) => void
  onGateExpire: () => void
}

export function GateCard({ hunter, onStartGate, onCompleteTask, onGateExpire }: GateCardProps) {
  const activeGate = hunter.activeGate
  const activeTemplate = activeGate
    ? (GATE_TEMPLATES.find((g) => g.id === activeGate.templateId) ?? null)
    : null
  const availableGate = activeGate
    ? null
    : checkGateUnlock(hunter.level || 1, hunter.clearedGates || [])
  const clearedGates = hunter.clearedGates || []

  return (
    <Card title="Gate" icon="🌀">
      {activeGate && activeTemplate ? (
        <ActiveGateView
          gate={activeGate}
          template={activeTemplate}
          onCompleteTask={onCompleteTask}
          onExpire={onGateExpire}
        />
      ) : availableGate ? (
        <AvailableGateView gate={availableGate} onStart={onStartGate} />
      ) : (
        <p className="py-4 text-center text-xs text-text-muted">
          No gate open right now. Keep leveling up — a new gate unlocks at higher ranks.
        </p>
      )}

      {clearedGates.length > 0 && <ClearedGatesList clearedGates={clearedGates} />}
    </Card>
  )
}

function ActiveGateView({
  gate,
  template,
  onCompleteTask,
  onExpire,
}: {
  gate: ActiveGate
  template: GateTemplate
  onCompleteTask: (taskId: string) => void
  onExpire: () => void
}) {
  const tier = gateTierColor(gate.tier)
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tier={tier}>
            {gate.tier}-Rank · {gate.name}
          </Badge>
          <div className="mt-2 text-xs text-text-secondary">
            Clear every task before it closes for +{resolveGateBonusXP(template)} XP
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-[10px] font-bold tracking-wide text-text-secondary uppercase">
            Closes in
          </div>
          <CountdownTimer expiresAt={gate.expiresAt} onExpire={onExpire} />
        </div>
      </div>
      <div className="divide-y divide-border">
        {template.tasks.map((t) => {
          const done = !!gate.completedTasks?.[t.id]
          const sm = STAT_META.find((s) => s.key === t.stat)
          return (
            <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="text-sm font-bold text-text-primary">
                  {done ? '☑' : '☐'} {t.label}
                </div>
                <div className="text-xs text-text-secondary">
                  +{t.xp} XP · {sm?.icon} {t.stat}
                </div>
              </div>
              <Button
                variant={done ? 'secondary' : 'primary'}
                disabled={done}
                onClick={() => onCompleteTask(t.id)}
                className="shrink-0"
              >
                {done ? '✓ Done' : 'Complete'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AvailableGateView({ gate, onStart }: { gate: GateTemplate; onStart: () => void }) {
  const tier = gateTierColor(gate.tier)
  const t = TIER_CLASSES[tier]
  return (
    <div>
      <p className="mb-3 text-xs text-text-secondary">
        A gate has opened. Clear its bundled tasks before time runs out for a big XP payout.
      </p>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3',
          t.border,
          t.bg,
        )}
      >
        <div>
          <Badge tier={tier}>
            {gate.tier}-Rank · {gate.name}
          </Badge>
          <div className="mt-2 text-xs text-text-secondary">
            {gate.tasks.length} tasks · {gate.duration_hours}h to clear · +
            {resolveGateBonusXP(gate)} XP bonus
          </div>
        </div>
        <Button onClick={onStart} className="shrink-0">
          Start Gate
        </Button>
      </div>
    </div>
  )
}

function ClearedGatesList({ clearedGates }: { clearedGates: string[] }) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 text-xs font-bold tracking-wide text-text-secondary uppercase">
        🏁 Cleared Gates
      </div>
      <div className="divide-y divide-border">
        {[...clearedGates].reverse().map((id, i) => {
          const template = GATE_TEMPLATES.find((g) => g.id === id)
          return (
            <div key={id + i} className="flex justify-between gap-2 py-1.5 text-xs">
              <span className="text-text-secondary">{template ? template.name : id}</span>
              <span className="shrink-0 font-bold text-text-muted">cleared</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
