import { STAT_META } from '../../lib/hunterState'
import { DAILY_QUESTS, type DailyQuest } from '../../lib/quests'
import { Button, Card } from '../ui'

export interface DailyQuestListProps {
  completedToday: Record<string, boolean>
  onClaim: (quest: DailyQuest) => void
}

export function DailyQuestList({ completedToday, onClaim }: DailyQuestListProps) {
  return (
    <Card title="Daily Quests" icon="⚔️">
      <div className="divide-y divide-border">
        {DAILY_QUESTS.map((q) => {
          const done = !!completedToday?.[q.id]
          const sm = STAT_META.find((s) => s.key === q.stat)
          return (
            <div key={q.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="text-sm font-bold text-text-primary">
                  {q.icon} {q.label}
                </div>
                <div className="text-xs text-text-secondary">
                  {q.hint} · +{q.xp} XP · {sm?.icon} {q.stat}
                </div>
              </div>
              <Button
                variant={done ? 'secondary' : 'primary'}
                disabled={done}
                onClick={() => onClaim(q)}
                className="shrink-0"
              >
                {done ? '✓ Done' : 'Claim'}
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
