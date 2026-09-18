import { useState } from 'react'
import type { NewCustomQuest } from '../../hooks/useCustomQuests'
import { questCategory, questIcon, type CustomQuest } from '../../lib/customQuests'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_QUESTS } from '../../lib/quests'
import { Badge, Card } from '../ui'
import { QuestForm } from './QuestForm'

export interface MyQuestsSectionProps {
  customQuests: CustomQuest[]
  completedToday: Record<string, boolean>
  onAdd: (quest: NewCustomQuest) => void
  onUpdate: (id: string, patch: NewCustomQuest) => void
  onSetActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

// Management UI for user-defined quests: add/edit/deactivate/delete, plus
// the fixed DAILY_QUESTS shown alongside them (read-only, clearly labeled)
// so it's visible at a glance that both sets are live and functionally
// equal. Actually completing a quest — the tap-a-tier flow — lives on the
// Today screen; this section is CRUD only.
export function MyQuestsSection({
  customQuests,
  completedToday,
  onAdd,
  onUpdate,
  onSetActive,
  onDelete,
}: MyQuestsSectionProps) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const startAdd = () => {
    setEditingId(null)
    setConfirmDeleteId(null)
    setAdding(true)
  }

  const startEdit = (id: string) => {
    setAdding(false)
    setConfirmDeleteId(null)
    setEditingId(id)
  }

  const cancelForm = () => {
    setAdding(false)
    setEditingId(null)
  }

  const submitAdd = (quest: NewCustomQuest) => {
    onAdd(quest)
    setAdding(false)
  }

  const submitEdit = (id: string, quest: NewCustomQuest) => {
    onUpdate(id, quest)
    setEditingId(null)
  }

  return (
    <Card title="My Quests" icon="🗒️">
      <p className="mb-4 text-xs text-text-secondary">
        Built-in quests always apply. Add your own recurring quests below — same rules, same XP
        path, just yours to define.
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
                    {sm?.icon} {q.stat} · +{q.xp} XP
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
          {!adding && (
            <button
              type="button"
              onClick={startAdd}
              className="cursor-pointer text-xs font-bold text-accent hover:text-accent-hover"
            >
              + Add Quest
            </button>
          )}
        </div>

        {customQuests.length === 0 && !adding && (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-text-muted">
            No custom quests yet — add one to track something the built-ins don't cover.
          </p>
        )}

        {customQuests.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border">
            {customQuests.map((q) =>
              editingId === q.id ? (
                <div key={q.id} className="p-3">
                  <QuestForm
                    initial={q}
                    onSave={(patch) => submitEdit(q.id, patch)}
                    onCancel={cancelForm}
                  />
                </div>
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
                        {questCategory(q.category).label} · {q.statKey} · {q.tiers.length} tier
                        {q.tiers.length === 1 ? '' : 's'}
                      </span>
                    </span>
                  </div>
                  {/* Actions get their own row (rather than squeezing into
                      the name's row) so a long quest name never gets
                      crushed into a narrow column at mobile widths. */}
                  <div className="flex items-center justify-end gap-3 text-[10px] font-bold uppercase">
                    <button
                      type="button"
                      onClick={() => startEdit(q.id)}
                      className="cursor-pointer text-text-muted hover:text-accent"
                    >
                      Edit
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

        {adding && (
          <div className="mt-3">
            <QuestForm onSave={submitAdd} onCancel={cancelForm} />
          </div>
        )}
      </div>
    </Card>
  )
}
