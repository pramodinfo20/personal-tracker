import { useState, type FormEvent } from 'react'
import { questCategoryLabel, questIcon, type CustomQuest } from '../../lib/customQuests'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_QUESTS, formatTierXPRange } from '../../lib/quests'
import { Badge, Button, Card } from '../ui'
import { ActivityPickerSheet } from './ActivityPickerSheet'

export interface MyQuestsSectionProps {
  customQuests: CustomQuest[]
  completedToday: Record<string, boolean>
  /** Saves a new recurring quest from an ACTIVITY_LIBRARY id. */
  onAdd: (activityId: string) => void
  onRename: (id: string, name: string) => void
  onSetActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

// Management UI for user-defined quests: add/rename/deactivate/delete, plus
// the fixed DAILY_QUESTS shown alongside them (read-only, clearly labeled)
// so it's visible at a glance that both sets are live and functionally
// equal. New quests come only from the activity library (ActivityPickerSheet
// in 'recurring' mode) with fixed tiers — tiers and XP aren't editable
// here, only the name. Actually completing a quest — the tap-a-tier flow —
// lives on the Today screen; this section is management only.
export function MyQuestsSection({
  customQuests,
  completedToday,
  onAdd,
  onRename,
  onSetActive,
  onDelete,
}: MyQuestsSectionProps) {
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const startRename = (q: CustomQuest) => {
    setConfirmDeleteId(null)
    setDraftName(q.name)
    setRenamingId(q.id)
  }

  const submitRename = (e: FormEvent, id: string) => {
    e.preventDefault()
    if (!draftName.trim()) return
    onRename(id, draftName)
    setRenamingId(null)
  }

  return (
    <Card title="My Quests" icon="🗒️">
      <p className="mb-4 text-xs text-text-secondary">
        Built-in quests always apply. Add your own recurring quests from the activity library —
        same rules, same XP path.
      </p>

      <div className="mb-4">
        <div className="mb-2 text-[10px] font-bold tracking-wide text-text-muted uppercase">
          Built-in
        </div>
        <div className="divide-y divide-border rounded-xl border border-border">
          {DAILY_QUESTS.map((q) => {
            const sm = STAT_META.find((s) => s.key === q.stat)
            return (
              <div key={q.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-xl" aria-hidden="true">
                  {q.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-text-primary">{q.label}</span>
                  <span className="block text-xs text-text-secondary">
                    {sm?.icon} {q.stat} · {formatTierXPRange(q.tiers)} XP
                  </span>
                </span>
                <Badge tier="silver" className="shrink-0 px-1.5 py-0 text-[9px]">
                  Fixed
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] font-bold tracking-wide text-text-muted uppercase">
            Custom
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="cursor-pointer text-xs font-bold text-accent hover:text-accent-hover"
          >
            + Add Quest
          </button>
        </div>

        {customQuests.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-text-muted">
            No custom quests yet — add one to track something the built-ins don't cover.
          </p>
        )}

        {customQuests.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border">
            {customQuests.map((q) =>
              renamingId === q.id ? (
                <form key={q.id} onSubmit={(e) => submitRename(e, q.id)} className="flex gap-2 p-3">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    aria-label="Quest name"
                    maxLength={40}
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-border bg-black/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                  <Button type="button" variant="secondary" onClick={() => setRenamingId(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!draftName.trim()}>
                    Save
                  </Button>
                </form>
              ) : (
                <div key={q.id} className="flex flex-col gap-2 px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden="true">
                      {questIcon(q.iconKey)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-text-primary">{q.name}</span>
                        {!q.active && (
                          <Badge tier="bronze" className="shrink-0 px-1.5 py-0 text-[9px]">
                            Inactive
                          </Badge>
                        )}
                        {q.active && completedToday?.[q.id] && (
                          <Badge tier="gold" className="shrink-0 px-1.5 py-0 text-[9px]">
                            Done today
                          </Badge>
                        )}
                      </span>
                      <span className="block text-xs text-text-secondary">
                        {questCategoryLabel(q.category)} · {q.statKey} ·{' '}
                        {formatTierXPRange(q.tiers)} XP
                      </span>
                    </span>
                  </div>
                  {/* Actions get their own row (rather than squeezing into
                      the name's row) so a long quest name never gets
                      crushed into a narrow column at mobile widths. */}
                  <div className="flex items-center justify-end gap-3 text-[10px] font-bold uppercase">
                    <button
                      type="button"
                      onClick={() => startRename(q)}
                      className="cursor-pointer text-text-muted hover:text-accent"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetActive(q.id, !q.active)}
                      className="cursor-pointer text-text-muted hover:text-text-primary"
                    >
                      {q.active ? 'Deactivate' : 'Activate'}
                    </button>
                    {confirmDeleteId === q.id ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="cursor-pointer text-text-muted hover:text-text-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(q.id)
                            setConfirmDeleteId(null)
                          }}
                          className="cursor-pointer text-warning hover:text-warning/80"
                        >
                          Confirm
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(q.id)}
                        className="cursor-pointer text-text-muted hover:text-warning"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {adding && (
        <ActivityPickerSheet mode="recurring" onAddQuest={onAdd} onClose={() => setAdding(false)} />
      )}
    </Card>
  )
}
