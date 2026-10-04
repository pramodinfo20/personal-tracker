import { useState, type FormEvent } from 'react'
import { cn } from '../../lib/cn'
import {
  emptyTrackerDraft,
  itemToDraft,
  validateTrackerDraft,
  type FieldDef,
  type TrackerDef,
  type TrackerDraft,
  type TrackerItem,
  type TrackerProblems,
} from '../../lib/trackers'
import { Button, ScreenBackground } from '../ui'
import { FIELD_CLASS, LABEL_CLASS } from '../ui/formStyles'

export interface TrackerSheetProps {
  def: TrackerDef
  /** The item being edited; omit to add a new one. */
  editing?: TrackerItem
  onSave: (draft: TrackerDraft) => void
  /** Edit mode only. */
  onDelete?: () => void
  onClose: () => void
}

const UNSELECTED = 'border-border bg-backing/40 text-text-secondary hover:text-text-primary'

const isOptional = (field: FieldDef) => !(field.kind === 'text' && field.required) && field.kind !== 'choice'

// Add or edit one record of any simple tracker — the same glass bottom
// sheet as Job Search's, with its form built from the tracker's fields.
export function TrackerSheet({ def, editing, onSave, onDelete, onClose }: TrackerSheetProps) {
  const [draft, setDraft] = useState<TrackerDraft>(() =>
    editing ? itemToDraft(def, editing) : emptyTrackerDraft(def),
  )
  const [problems, setProblems] = useState<TrackerProblems>({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const set = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateTrackerDraft(def, draft)
    setProblems(found)
    if (Object.keys(found).length === 0) onSave(draft)
  }

  const title = editing ? `Edit ${def.singular}` : `New ${def.singular}`
  const inputId = (field: FieldDef) => `${def.id}-${field.key}`

  const control = (field: FieldDef, index: number) => {
    const id = inputId(field)
    const value = draft[field.key] ?? ''
    const invalid = Boolean(problems[field.key])
    switch (field.kind) {
      case 'text':
        return (
          <>
            <input
              id={id}
              autoFocus={!editing && index === 0}
              value={value}
              onChange={(e) => set(field.key, e.target.value)}
              maxLength={field.maxLength}
              list={field.suggestions ? `${id}-suggestions` : undefined}
              aria-invalid={invalid}
              className={FIELD_CLASS}
            />
            {field.suggestions && (
              <>
                <datalist id={`${id}-suggestions`}>
                  {field.suggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                {/* Tappable presets — datalist support on phones is patchy. */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {field.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set(field.key, s)}
                      aria-pressed={value === s}
                      className={cn(
                        'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold',
                        value === s ? 'border-accent/50 bg-accent/15 text-accent-hover' : UNSELECTED,
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )
      case 'notes':
        return (
          <textarea
            id={id}
            value={value}
            onChange={(e) => set(field.key, e.target.value)}
            maxLength={1000}
            rows={3}
            className={cn(FIELD_CLASS, 'resize-y')}
          />
        )
      case 'date':
        return (
          <input
            id={id}
            type="date"
            value={value}
            onChange={(e) => set(field.key, e.target.value)}
            aria-invalid={invalid}
            className={FIELD_CLASS}
          />
        )
      case 'link':
        return (
          <input
            id={id}
            inputMode="url"
            value={value}
            onChange={(e) => set(field.key, e.target.value)}
            maxLength={500}
            placeholder="https://"
            aria-invalid={invalid}
            className={FIELD_CLASS}
          />
        )
      case 'choice':
        return (
          <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
            {field.options.map((o) => {
              const selected = value === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set(field.key, o.value)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase',
                    selected ? o.pill : UNSELECTED,
                  )}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        )
    }
  }

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
              {def.icon} {title}
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
            {def.fields.map((field, index) => {
              const hint =
                field.kind === 'text' && field.required ? '(required)' : isOptional(field) ? '(optional)' : ''
              const labelText = (
                <>
                  {field.label} {hint && <span className="font-normal">{hint}</span>}
                </>
              )
              return (
                <div key={field.key}>
                  {field.kind === 'choice' ? (
                    <div className={LABEL_CLASS} id={`${inputId(field)}-label`}>
                      {labelText}
                    </div>
                  ) : (
                    <label htmlFor={inputId(field)} className={LABEL_CLASS}>
                      {labelText}
                    </label>
                  )}
                  {control(field, index)}
                  {problems[field.key] && (
                    <p role="alert" className="mt-1 text-xs font-bold text-warning">
                      {problems[field.key]}
                    </p>
                  )}
                </div>
              )
            })}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? 'Save changes' : `Add ${def.singular}`}
              </Button>
            </div>
          </form>

          {editing && onDelete && (
            <div className="mt-5 border-t border-hairline pt-4">
              {confirmingDelete ? (
                <div role="alertdialog" aria-label="Confirm delete">
                  <p className="text-xs font-bold text-text-primary">
                    Delete this {def.singular}? This can't be undone.
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
                  Delete {def.singular}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ScreenBackground>
  )
}
