import { cn } from '../../lib/cn'
import { SHADOW_MILESTONES } from '../../lib/shadows'
import { Badge, Card } from '../ui'
import { shadowTierColor } from './tierMapping'

export interface ShadowArmyGridProps {
  unlockedShadows: number[]
}

export function ShadowArmyGrid({ unlockedShadows }: ShadowArmyGridProps) {
  return (
    <Card title="Shadow Army" icon="🌑">
      <p className="mb-4 text-xs text-text-secondary">
        Extract a shadow soldier every time you hit a milestone level.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {SHADOW_MILESTONES.map((milestone) => {
          const unlocked = unlockedShadows.includes(milestone.level)
          const tier = shadowTierColor(milestone.title)
          return (
            <div
              key={milestone.level}
              title={
                unlocked
                  ? `${milestone.name} — ${milestone.desc}`
                  : `Reach level ${milestone.level} to extract this shadow`
              }
              className={cn(
                'rounded-xl border p-3 text-center transition-transform',
                unlocked
                  ? 'border-border-strong bg-gradient-to-b from-surface to-surface-2 hover:-translate-y-0.5'
                  : 'border-dashed border-border bg-surface-2/50',
              )}
            >
              <span
                className="block text-3xl"
                style={
                  unlocked
                    ? { filter: `drop-shadow(0 0 8px ${milestone.color})` }
                    : { filter: 'grayscale(1) opacity(.35)' }
                }
              >
                {unlocked ? milestone.icon : '❔'}
              </span>
              {unlocked ? (
                <>
                  <div className="mt-2 truncate text-xs font-bold text-text-primary">
                    {milestone.name}
                  </div>
                  <Badge tier={tier} className="mt-1">
                    {milestone.title.replace(' Shadow', '')}
                  </Badge>
                </>
              ) : (
                <div className="mt-2 text-xs text-text-muted">Lv.{milestone.level}</div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
