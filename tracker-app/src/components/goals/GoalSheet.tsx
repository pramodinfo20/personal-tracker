import { useState, type FormEvent } from 'react'
import { cn } from '../../lib/cn'
import {
  GOAL_CATEGORIES,
  GOAL_STATUSES,
  GOAL_STATUS_LABEL,
  emptyGoalDraft,
  goalToDraft,
  relatedQuestName,
  validateGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalProblems,
} from '../../lib/goals'
import { Button, ScreenBackground } from '../ui'
import { FIELD_CLASS, LABEL_CLASS } from '../ui/formStyles'
import { GOAL_STATUS_PILL } from './statusPill'

export interface GoalSheetProps {
  /** The goal being edited; omit to add a new one. */
  editing?: Goal
  onSave: (draft: GoalDraft) => void
  /** Edit mode only. */
  onDelete?: () => void
  onClose: () => void
}

const UNSELECTED = 'border-border bg-backing/40 text-text-secondary hover:text-text-primary'

// Add or edit one goal — the same glass bottom sheet as Job Search's.
export function GoalSheet({ editing, onSave, onDelete, onClose }: GoalSheetProps) {
  const [draft, setDraft] = useState<GoalDraft>(() => (editing ? goalToDraft(editing) : emptyGoalDraft()))
  const [problems, setProblems] = useState<GoalProblems>({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const set = <K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateGoalDraft(draft)
    setProblems(found)
    if (Object.keys(found).length === 0) onSave(draft)
  }

  const title = editing ? 'Edit goal' : 'New goal'
  const quest = relatedQuestName(draft.category)

  return (
    <ScreenBackground screen="generic" layout="overlay" className="z-40">
      <div className="flex h-full items-end justify-center" onClick={onClose}>
        <div
          role="dialog"
          aria-label={title}
          className="hud-glass hud-glass-strong max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-b-0 p-5 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">🎯 {title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-2xl leading-none text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="goal-title" className={LABEL_CLASS}>
                Goal <span className="font-normal">(required)</span>
              </label>
              <input
                id="goal-title"
                autoFocus={!editing}
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={100}
                aria-invalid={Boolean(problems.title)}
                className={FIELD_CLASS}
              />
              {problems.title && (
                <p role="alert" className="mt-1 text-xs font-bold text-warning">
                  {problems.title}
                </p>
              )}
            </div>

            <div>
              <div className={LABEL_CLASS} id="goal-category-label">
                Category
              </div>
              <div role="radiogroup" aria-labelledby="goal-category-label" className="flex flex-wrap gap-2">
                {GOAL_CATEGORIES.map((c) => {
                  const selected = draft.category === c.key
                  return (
                    <button
                      key={c.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set('category', c.key)}
                      className={cn(
                        'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold',
                        selected ? 'border-accent/50 bg-accent/15 text-accent-hover' : UNSELECTED,
                      )}
                    >
                      <span aria-hidden="true">{c.category.icon}</span> {c.label}
                    </button>
                  )
                })}
              </div>
              {quest && (
                <p className="mt-2 text-[11px] text-text-secondary">Tracked via {quest} quest.</p>
              )}
            </div>

            <div>
              <label htmlFor="goal-date" className={LABEL_CLASS}>
                Target date <span className="font-normal">(optional)</span>
              </label>
              <input
                id="goal-date"
                type="date"
                value={draft.targetDate}
                onChange={(e) => set('targetDate', e.target.value)}
                aria-invalid={Boolean(problems.targetDate)}
                className={FIELD_CLASS}
              />
              {problems.targetDate && (
                <p role="alert" className="mt-1 text-xs font-bold text-warning">
                  {problems.targetDate}
                </p>
              )}
            </div>

            <div>
              <div className={LABEL_CLASS} id="goal-status-label">
                Status
              </div>
              <div role="radiogroup" aria-labelledby="goal-status-label" className="flex flex-wrap gap-2">
                {GOAL_STATUSES.map((s) => {
                  const selected = draft.status === s
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set('status', s)}
                      className={cn(
                        'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase',
                        selected ? GOAL_STATUS_PILL[s] : UNSELECTED,
                      )}
                    >
                      {GOAL_STATUS_LABEL[s]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? 'Save changes' : 'Add goal'}
              </Button>
            </div>
          </form>

          {editing && onDelete && (
            <div className="mt-5 border-t border-hairline pt-4">
              {confirmingDelete ? (
                <div role="alertdialog" aria-label="Confirm delete">
                  <p className="text-xs font-bold text-text-primary">
                    Delete this goal? This can't be undone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1"
                    >
                      Keep it
                    </Button>
                    <Button type="button" variant="secondary" onClick={onDelete} className="flex-1">
                      Yes, delete
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="cursor-pointer text-xs font-bold text-text-secondary hover:text-warning"
                >
                  Delete goal
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ScreenBackground>
  )
}
