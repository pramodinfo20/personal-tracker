import { useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useAndroidBackAction } from '../../hooks/useAndroidBackAction'
import { cn } from '../../lib/cn'
import {
  GOAL_STATUS_LABEL,
  goalCategory,
  goalCounts,
  isOverdue,
  relatedQuestName,
  sortGoals,
  type Goal,
  type GoalDraft,
  type GoalStatus,
} from '../../lib/goals'
import { formatAppliedDate } from '../../lib/jobApplications'
import { ScreenBackground } from '../ui'
import { FAB_CLASS } from '../ui/formStyles'
import { GoalSheet } from './GoalSheet'
import { GOAL_STATUS_PILL } from './statusPill'

export interface GoalsScreenProps {
  goals: Goal[]
  onAdd: (draft: GoalDraft) => Goal | null
  onUpdate: (id: string, draft: GoalDraft) => boolean
  onSetStatus: (id: string, status: GoalStatus) => void
  onDelete: (id: string) => void
  onBack: () => void
}

type SheetState = { mode: 'add' } | { mode: 'edit'; id: string } | null

// The Goals tracker (More → Goals). Same list / "+" / tap-to-edit pattern
// as Job Search, plus a one-tap "mark done" on each card.
export function GoalsScreen({ goals, onAdd, onUpdate, onSetStatus, onDelete, onBack }: GoalsScreenProps) {
  const [sheet, setSheet] = useState<SheetState>(null)
  useAndroidBackAction(sheet !== null, () => setSheet(null), 100)
  const sorted = useMemo(() => sortGoals(goals), [goals])
  const counts = goalCounts(goals)
  const editing = sheet?.mode === 'edit' ? goals.find((g) => g.id === sheet.id) : undefined

  const save = (draft: GoalDraft) => {
    const ok = sheet?.mode === 'edit' ? onUpdate(sheet.id, draft) : Boolean(onAdd(draft))
    if (ok) setSheet(null)
  }

  return (
    <ScreenBackground screen="generic" className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-xs font-bold text-text-secondary hover:text-text-primary"
        >
          ‹ More
        </button>
        <h1 className="mt-2 text-xl font-extrabold text-text-primary">🎯 Goals</h1>

        <dl className="mt-4 mb-5 grid grid-cols-2 gap-3" aria-label="Goal counts">
          {[
            { label: 'Active', value: counts.active },
            { label: 'Done', value: counts.done },
          ].map((s) => (
            <div key={s.label} className="hud-glass rounded-2xl px-4 py-3">
              <dd className="font-mono text-2xl font-black text-text-primary">{s.value}</dd>
              <dt className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>

        {sorted.length === 0 ? (
          <div className="hud-glass rounded-2xl p-6 text-center">
            <div className="hud-icon mx-auto h-14 w-14 text-3xl" aria-hidden="true">
              🎯
            </div>
            <div className="mt-3 text-base font-extrabold text-text-primary">No goals yet</div>
            <p className="mt-1 text-sm text-text-secondary">Tap + to add the first one.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((g, i) => {
              const done = g.status === 'done'
              const category = goalCategory(g.category)
              const quest = relatedQuestName(g.category)
              const overdue = isOverdue(g)
              return (
                <li
                  key={g.id}
                  className="hud-glass hud-enter flex items-stretch overflow-hidden rounded-2xl"
                  style={{ '--i': Math.min(i, 8) } as CSSProperties}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    aria-label={done ? `Reopen ${g.title}` : `Mark ${g.title} done`}
                    onClick={() => onSetStatus(g.id, done ? 'in_progress' : 'done')}
                    className="hud-pressable flex shrink-0 cursor-pointer items-center pr-1 pl-4"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-black',
                        done
                          ? 'border-success bg-success/20 text-success'
                          : 'border-border-strong text-transparent',
                      )}
                    >
                      ✓
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet({ mode: 'edit', id: g.id })}
                    aria-label={`Edit ${g.title}`}
                    className="hud-pressable min-w-0 flex-1 cursor-pointer py-3.5 pr-4 pl-3 text-left"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'min-w-0 text-sm font-extrabold break-words text-text-primary',
                          done && 'text-text-secondary line-through',
                        )}
                      >
                        {g.title}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase',
                          GOAL_STATUS_PILL[g.status],
                        )}
                      >
                        {GOAL_STATUS_LABEL[g.status]}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-xs text-text-secondary">
                      <span aria-hidden="true">{category.category.icon}</span> {category.label}
                      {g.targetDate && (
                        <span className={overdue ? 'font-bold text-warning' : 'text-text-muted'}>
                          {' · '}
                          {overdue ? 'Overdue — was due ' : 'Due '}
                          {formatAppliedDate(g.targetDate)}
                        </span>
                      )}
                    </span>
                    {quest && (
                      <span className="mt-1 block text-[11px] text-text-muted">
                        Tracked via {quest} quest
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button type="button" onClick={() => setSheet({ mode: 'add' })} aria-label="Add goal" className={FAB_CLASS}>
        +
      </button>

      {/* Portalled to <body> so the sheet covers the bottom tab bar. */}
      {sheet?.mode === 'add' &&
        createPortal(<GoalSheet onSave={save} onClose={() => setSheet(null)} />, document.body)}
      {sheet?.mode === 'edit' &&
        editing &&
        createPortal(
          <GoalSheet
            key={editing.id}
            editing={editing}
            onSave={save}
            onDelete={() => {
              onDelete(editing.id)
              setSheet(null)
            }}
            onClose={() => setSheet(null)}
          />,
          document.body,
        )}
    </ScreenBackground>
  )
}
