import { useState } from 'react'
import type { Hunter } from '../../lib/hunterState'

export interface DevActions {
  resetHunter: () => void
  jumpToLevel: (level: number) => void
  clearGateHistory: () => void
}

export interface DevTestingPanelProps {
  hunter: Hunter
  dev: DevActions
  /** Closes the containing Profile sheet — needed after a full reset. */
  onClose: () => void
}

// ── DEV TESTING ONLY — ported from pramod-2026-tracker.html's throwaway
// debug panel. Rendered by ProfileSheet only under import.meta.env.DEV, so
// it never ships in a production build. Delete this file (and useHunter's
// `dev`) when it's no longer needed.
export function DevTestingPanel({ hunter, dev, onClose }: DevTestingPanelProps) {
  const [devOpen, setDevOpen] = useState(false)
  const [devLevel, setDevLevel] = useState(String(hunter.level || 1))

  const resetHunter = () => {
    const ok = window.confirm(
      'Reset hunter to Level 1? This wipes real progress (XP, log, shadows, gates).',
    )
    if (!ok) return
    dev.resetHunter()
    // The reset clears the name, which sends the app back to onboarding —
    // close first so the sheet doesn't reopen on top of the fresh hunter.
    onClose()
  }

  return (
    <div className="mt-6 rounded-xl border border-dashed border-border-strong px-3 py-2.5">
      <button
        type="button"
        onClick={() => setDevOpen((o) => !o)}
        aria-expanded={devOpen}
        className="flex w-full cursor-pointer items-center gap-1.5 text-left text-[11px] font-bold text-text-muted"
      >
        <span aria-hidden="true">{devOpen ? '▾' : '▸'}</span>
        🛠 Dev Testing — not part of the app
      </button>
      {devOpen && (
        <div className="mt-2.5 flex flex-col gap-2.5 border-t border-dashed border-border-strong pt-2.5">
          <p className="text-[10px] text-text-muted">
            Debug-only controls for testing gates across levels. These write state directly
            and bypass the real XP/quest logic.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetHunter}
              className="cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary"
            >
              Reset Hunter to Level 1
            </button>
            <button
              type="button"
              onClick={dev.clearGateHistory}
              className="cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary"
            >
              Clear Cleared-Gates History
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="dev-level" className="text-[10px] text-text-secondary">
              Jump to Level:
            </label>
            <input
              id="dev-level"
              type="number"
              min={1}
              value={devLevel}
              onChange={(e) => setDevLevel(e.target.value)}
              className="w-16 rounded-md border border-dashed border-border-strong bg-surface-2 px-1.5 py-1 text-[11px] text-text-primary"
            />
            <button
              type="button"
              onClick={() => dev.jumpToLevel(Number(devLevel))}
              className="cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary"
            >
              Jump
            </button>
          </div>
          <div className="text-[10px] text-text-muted">
            Current: Level {hunter.level || 1} · {hunter.xp || 0} XP ·{' '}
            {(hunter.clearedGates || []).length} gate(s) cleared
          </div>
        </div>
      )}
    </div>
  )
}
