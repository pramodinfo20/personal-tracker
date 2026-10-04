import { useState, type FormEvent } from 'react'
import { cn } from '../../lib/cn'
import {
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  applicationToDraft,
  emptyDraft,
  validateDraft,
  type DraftProblems,
  type JobApplication,
  type JobApplicationDraft,
} from '../../lib/jobApplications'
import type { XPTier } from '../../lib/quests'
import { Button, ScreenBackground } from '../ui'
import { FIELD_CLASS as FIELD, LABEL_CLASS as LABEL } from '../ui/formStyles'
import { STATUS_PILL } from './statusPill'

export interface JobApplicationSheetProps {
  /** The application being edited; omit to add a new one. */
  editing?: JobApplication
  /**
   * Add mode only: the Hunter Association tier a claim would use, or null
   * when that quest is already claimed today (the checkbox is then disabled).
   */
  questTier?: XPTier | null
  onSave: (draft: JobApplicationDraft, claimQuest: boolean) => void
  /** Edit mode only. */
  onDelete?: () => void
  onClose: () => void
}

// Add or edit one application: a glass bottom sheet, same shape as the
// Profile and Manage Quests sheets. Tapping the backdrop closes it.
export function JobApplicationSheet({
  editing,
  questTier,
  onSave,
  onDelete,
  onClose,
}: JobApplicationSheetProps) {
  const [draft, setDraft] = useState<JobApplicationDraft>(() =>
    editing ? applicationToDraft(editing) : emptyDraft(),
  )
  const [problems, setProblems] = useState<DraftProblems>({})
  const [claim, setClaim] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const set = <K extends keyof JobApplicationDraft>(key: K, value: JobApplicationDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateDraft(draft)
    setProblems(found)
    if (Object.keys(found).length > 0) return
    onSave(draft, claim && Boolean(questTier))
  }

  const title = editing ? 'Edit application' : 'New application'

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
            <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">
              💼 {title}
            </h2>
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
              <label htmlFor="job-company" className={LABEL}>
                Company <span className="font-normal">(required)</span>
              </label>
              <input
                id="job-company"
                autoFocus={!editing}
                value={draft.company}
                onChange={(e) => set('company', e.target.value)}
                maxLength={80}
                aria-invalid={Boolean(problems.company)}
                className={FIELD}
              />
              {problems.company && (
                <p role="alert" className="mt-1 text-xs font-bold text-warning">
                  {problems.company}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="job-role" className={LABEL}>
                Role
              </label>
              <input
                id="job-role"
                value={draft.role}
                onChange={(e) => set('role', e.target.value)}
                maxLength={80}
                className={FIELD}
              />
            </div>

            <div>
              <label htmlFor="job-date" className={LABEL}>
                Date applied
              </label>
              <input
                id="job-date"
                type="date"
                value={draft.dateApplied}
                onChange={(e) => set('dateApplied', e.target.value)}
                aria-invalid={Boolean(problems.dateApplied)}
                className={FIELD}
              />
              {problems.dateApplied && (
                <p role="alert" className="mt-1 text-xs font-bold text-warning">
                  {problems.dateApplied}
                </p>
              )}
            </div>

            <div>
              <div className={LABEL} id="job-status-label">
                Status
              </div>
              <div role="radiogroup" aria-labelledby="job-status-label" className="flex flex-wrap gap-2">
                {JOB_STATUSES.map((s) => {
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
                        selected
                          ? STATUS_PILL[s]
                          : 'border-border bg-backing/40 text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {JOB_STATUS_LABEL[s]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="job-link" className={LABEL}>
                Link to the posting <span className="font-normal">(optional)</span>
              </label>
              <input
                id="job-link"
                inputMode="url"
                value={draft.link}
                onChange={(e) => set('link', e.target.value)}
                maxLength={500}
                placeholder="https://"
                aria-invalid={Boolean(problems.link)}
                className={FIELD}
              />
              {problems.link && (
                <p role="alert" className="mt-1 text-xs font-bold text-warning">
                  {problems.link}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="job-notes" className={LABEL}>
                Notes <span className="font-normal">(optional)</span>
              </label>
              <textarea
                id="job-notes"
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
                maxLength={1000}
                rows={3}
                className={cn(FIELD, 'resize-y')}
              />
            </div>

            {/* Add mode only: one application counts as a Hunter Association
                action. The claim itself is the normal quest claim. */}
            {!editing && questTier !== undefined && (
              <label
                className={cn(
                  'hud-inset flex items-start gap-3 rounded-xl px-3 py-3',
                  questTier ? 'cursor-pointer' : 'opacity-60',
                )}
              >
                <input
                  type="checkbox"
                  checked={claim && Boolean(questTier)}
                  disabled={!questTier}
                  onChange={(e) => setClaim(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="block text-sm font-bold text-text-primary">
                    Also claim Hunter Association quest for today
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {questTier
                      ? `+${questTier.xp} XP · ${questTier.label}`
                      : 'Already claimed today.'}
                  </span>
                </span>
              </label>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? 'Save changes' : 'Add application'}
              </Button>
            </div>
          </form>

          {editing && onDelete && (
            <div className="mt-5 border-t border-hairline pt-4">
              {confirmingDelete ? (
                <div role="alertdialog" aria-label="Confirm delete">
                  <p className="text-xs font-bold text-text-primary">
                    Delete this application? This can't be undone.
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
                  Delete application
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ScreenBackground>
  )
}
