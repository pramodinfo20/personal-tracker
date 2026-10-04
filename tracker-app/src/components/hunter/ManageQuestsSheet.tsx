import { useState, type FormEvent } from 'react'
import { MANAGE_QUESTS_COPY } from '../../lib/copy'
import { STAT_META } from '../../lib/hunterState'
import type { QuestEntry } from '../../lib/questVisibility'
import { formatTierXPRange } from '../../lib/quests'
import { Badge, Button, ScreenBackground, Switch } from '../ui'
import { ActivityPickerSheet } from './ActivityPickerSheet'

export interface ManageQuestsSheetProps {
  /** Every quest — fixed and custom — from questEntries(). */
  entries: QuestEntry[]
  completedToday: Record<string, boolean>
  /** Show/hide a quest on Today. The caller routes by entry.kind. */
  onSetEnabled: (entry: QuestEntry, enabled: boolean) => void
  /** Saves a new recurring quest from an ACTIVITY_LIBRARY id. */
  onAdd: (activityId: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

// The one place to manage what shows on Today: every quest, built-in and
// custom alike, with the same show/hide switch. Custom quests additionally
// keep their existing management — add (from the activity library, fixed
// tiers), rename, delete. Hiding is display-only: it never touches a claim,
// XP or the log. Opened from Profile, Level Up, and Today's empty state.
export function ManageQuestsSheet({
  entries,
  completedToday,
  onSetEnabled,
  onAdd,
  onRename,
  onDelete,
  onClose,
}: ManageQuestsSheetProps) {
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fixed = entries.filter((e) => e.kind === 'fixed')
  const custom = entries.filter((e) => e.kind === 'custom')
  const enabledCount = entries.filter((e) => e.enabled).length

  const startRename = (entry: QuestEntry) => {
    setConfirmDeleteId(null)
    setDraftName(entry.quest.label)
    setRenamingId(entry.quest.id)
  }

  const submitRename = (e: FormEvent, id: string) => {
    e.preventDefault()
    if (!draftName.trim()) return
    onRename(id, draftName)
    setRenamingId(null)
  }

  // One row for both kinds: icon, name, stat · XP range, and the switch.
  const row = (entry: QuestEntry) => {
    const { quest, enabled } = entry
    const sm = STAT_META.find((s) => s.key === quest.stat)
    return (
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden="true">
          {quest.icon}
        </span>
        <span className={enabled ? 'min-w-0 flex-1' : 'min-w-0 flex-1 opacity-60'}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-text-primary">{quest.label}</span>
            {enabled && completedToday?.[quest.id] && (
              <Badge tier="gold" className="shrink-0 px-1.5 py-0 text-[9px]">
                Done today
              </Badge>
            )}
          </span>
          <span className="block text-xs text-text-secondary">
            {entry.kind === 'custom' && `${quest.hint} · `}
            {sm?.icon} {quest.stat} · {formatTierXPRange(quest.tiers)} XP
          </span>
        </span>
        <Switch
          checked={enabled}
          onChange={(next) => onSetEnabled(entry, next)}
          label={`Show ${quest.label} on Today`}
        />
      </div>
    )
  }

  return (
    <ScreenBackground screen="profile" layout="overlay" className="z-40">
      <div className="flex h-full items-end justify-center" onClick={onClose}>
        <div
          role="dialog"
          aria-label="Manage quests"
          className="hud-glass hud-glass-strong max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-b-0 p-5 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">
              🗒️ Manage Quests
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
          <p className="mb-1 text-xs text-text-secondary">{MANAGE_QUESTS_COPY.subtitle}</p>
          <p className="mb-4 text-xs text-text-secondary">
            Choose which quests show on Today. {enabledCount} of {entries.length} shown.
          </p>

          <div className="mb-5">
            <div className="mb-2 text-[10px] font-bold tracking-wide text-text-secondary uppercase">
              Built-in
            </div>
            <div className="hud-inset divide-y divide-hairline rounded-xl">
              {fixed.map((entry) => (
                <div key={entry.quest.id} className="px-3 py-2.5">
                  {row(entry)}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-bold tracking-wide text-text-secondary uppercase">
                Custom
              </div>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="cursor-pointer text-xs font-bold text-accent-hover hover:text-text-primary"
              >
                + Add Quest
              </button>
            </div>

            {custom.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-text-secondary">
                No custom quests yet — add one to track something the built-ins don't cover.
              </p>
            ) : (
              <div className="hud-inset divide-y divide-hairline rounded-xl">
                {custom.map((entry) =>
                  renamingId === entry.quest.id ? (
                    <form
                      key={entry.quest.id}
                      onSubmit={(e) => submitRename(e, entry.quest.id)}
                      className="flex gap-2 p-3"
                    >
                      <input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        aria-label="Quest name"
                        maxLength={40}
                        autoFocus
                        className="min-w-0 flex-1 rounded-lg border border-border bg-backing/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                      />
                      <Button type="button" variant="secondary" onClick={() => setRenamingId(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!draftName.trim()}>
                        Save
                      </Button>
                    </form>
                  ) : (
                    <div key={entry.quest.id} className="flex flex-col gap-2 px-3 py-2.5">
                      {row(entry)}
                      {/* Actions get their own row so a long quest name never
                          gets crushed into a narrow column at mobile widths. */}
                      <div className="flex items-center justify-end gap-3 text-[10px] font-bold uppercase">
                        <button
                          type="button"
                          onClick={() => startRename(entry)}
                          className="cursor-pointer text-text-secondary hover:text-accent-hover"
                        >
                          Rename
                        </button>
                        {confirmDeleteId === entry.quest.id ? (
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="cursor-pointer text-text-secondary hover:text-text-primary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDelete(entry.quest.id)
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
                            onClick={() => setConfirmDeleteId(entry.quest.id)}
                            className="cursor-pointer text-text-secondary hover:text-warning"
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
        </div>
      </div>

      {adding && (
        <ActivityPickerSheet mode="recurring" onAddQuest={onAdd} onClose={() => setAdding(false)} />
      )}
    </ScreenBackground>
  )
}
