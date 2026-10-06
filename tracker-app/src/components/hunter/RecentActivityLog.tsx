import { useEffect, useState } from 'react'
import type { UndoResult } from '../../hooks/useHunter'
import { dateKeyFromTimestamp, today } from '../../lib/format'
import type { LogEntry } from '../../lib/hunterState'
import { isLoggedActivity } from '../../lib/quests'
import { Card } from '../ui'

export interface RecentActivityLogProps {
  log: LogEntry[]
  limit?: number
  /** Undo a Log Activity entry from today. Omit to render the log read-only. */
  onUndoActivity?: (entryId: number) => UndoResult
}

// A confirm/message auto-dismisses after this long if left untouched —
// same timing as the quest cards' undo.
const AUTO_DISMISS_MS = 5000

// The latest log entries. Activities logged TODAY via "+" (not quest
// claims, which are undone on their own cards, and not gate results) get
// the same Undo -> inline "Yes, undo" confirm the quest cards use; a
// refused undo (the strand guard) shows its reason in place.
export function RecentActivityLog({ log, limit = 10, onUndoActivity }: RecentActivityLogProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [blocked, setBlocked] = useState<{ id: number; reason: string } | null>(null)

  useEffect(() => {
    if (confirmingId === null) return
    const t = setTimeout(() => setConfirmingId(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [confirmingId])

  useEffect(() => {
    if (!blocked) return
    const t = setTimeout(() => setBlocked(null), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [blocked])

  const confirmUndo = (id: number) => {
    setConfirmingId(null)
    const result = onUndoActivity?.(id)
    if (result && !result.ok) setBlocked({ id, reason: result.reason ?? "Couldn't undo that." })
  }

  const entries = log.slice(0, limit)
  const todayKey = today()

  return (
    <Card title="Recent Activity" icon="📜">
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          No activity yet — claim a quest above to begin your hunt.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((e) => {
            const undoable =
              !!onUndoActivity && isLoggedActivity(e) && dateKeyFromTimestamp(e.date) === todayKey
            const blockedReason = blocked?.id === e.id ? blocked.reason : null
            return (
              <div key={e.id} className="py-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 text-text-secondary">
                    {e.label}
                    {/* Pre-tier entries have no tier — they show the label alone. */}
                    {e.tier && <span className="text-text-muted"> · {e.tier}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono font-bold text-accent-hover">
                      +{e.xp} XP · {e.stat}
                    </span>
                    {undoable &&
                      (confirmingId === e.id ? (
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-bold text-text-muted hover:text-text-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmUndo(e.id)}
                            className="cursor-pointer rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning hover:bg-warning/20"
                          >
                            Yes, undo
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setBlocked(null)
                            setConfirmingId(e.id)
                          }}
                          aria-label={`Undo ${e.label}`}
                          className="cursor-pointer text-[10px] font-bold text-text-secondary uppercase hover:text-warning"
                        >
                          Undo
                        </button>
                      ))}
                  </span>
                </div>
                {blockedReason && (
                  <p role="alert" className="mt-1 font-bold text-warning">
                    {blockedReason}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
