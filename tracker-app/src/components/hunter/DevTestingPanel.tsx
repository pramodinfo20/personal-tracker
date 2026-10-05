import { useState } from 'react'
import { accessibleRanks } from '../../lib/companions'
import type { Hunter } from '../../lib/hunterState'
import { currentStreak } from '../../lib/progress'

export interface DevActions {
  resetHunter: () => void
  /** Sets the level (and the matching milestone record — see lib/devTools.ts). */
  jumpToLevel: (level: number) => void
  clearGateHistory: () => void
  grantTickets: (count: number) => void
  setStreak: (days: number) => void
}

export interface DevTestingPanelProps {
  hunter: Hunter
  dev: DevActions
  /** Closes the containing Profile sheet — needed after a full reset. */
  onClose: () => void
  /** A live (production) build: show the "this is your real data" warning. */
  live?: boolean
}

export const LIVE_WARNING =
  'Live build — these tools overwrite your real saved data (Set streak fabricates history). Use a separate browser profile/incognito, or Download Backup first.'

const BUTTON =
  'cursor-pointer rounded-md border border-dashed border-border-strong px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary'
const INPUT =
  'w-16 rounded-md border border-dashed border-border-strong bg-surface-2 px-1.5 py-1 text-[11px] text-text-primary'

interface NumberActionProps {
  id: string
  label: string
  button: string
  initial: number
  min: number
  onApply: (value: number) => void
}

// One "label [number] [button]" row.
function NumberAction({ id, label, button, initial, min, onApply }: NumberActionProps) {
  const [value, setValue] = useState(String(initial))
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-24 shrink-0 text-[10px] text-text-secondary">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={INPUT}
      />
      <button type="button" onClick={() => onApply(Number(value))} className={BUTTON}>
        {button}
      </button>
    </div>
  )
}

// ── DEV TESTING ONLY — ported from pramod-2026-tracker.html's throwaway
// debug panel. Rendered by ProfileSheet only when isDevToolsEnabled()
// (lib/devToolsGate.ts): dev builds, or a live build with the env flag on
// in a browser that has been unlocked. Delete this file (and useHunter's
// `dev`, and lib/devTools.ts) when it's no longer needed.
//
// To test the companion lottery end to end in under a minute:
//   Set level 12  ->  Grant tickets  ->  Level Up tab -> Summon.
// For the streak bonus: Set streak 7, then claim any quest on Today.
export function DevTestingPanel({ hunter, dev, onClose, live = false }: DevTestingPanelProps) {
  const [devOpen, setDevOpen] = useState(false)

  const resetHunter = () => {
    const ok = window.confirm(
      'Reset hunter to Level 1? This wipes real progress (XP, log, companions, gates).',
    )
    if (!ok) return
    dev.resetHunter()
    // The reset clears the name, which sends the app back to onboarding —
    // close first so the sheet doesn't reopen on top of the fresh hunter.
    onClose()
  }

  const ranks = accessibleRanks(hunter.level || 1, hunter.unlockedShadows ?? [])

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
      {/* Always visible on a live build, open or collapsed. */}
      {live && (
        <p
          role="alert"
          className="mt-2 rounded-md border border-warning/60 bg-warning/10 px-2.5 py-2 text-[11px] font-bold text-warning"
        >
          ⚠️ {LIVE_WARNING}
        </p>
      )}
      {devOpen && (
        <div className="mt-2.5 flex flex-col gap-2.5 border-t border-dashed border-border-strong pt-2.5">
          <p className="text-[10px] text-text-muted">
            Debug-only controls for testing gates, companion ranks and the lottery. These write
            state directly and bypass the real XP/quest/ticket logic.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetHunter} className={BUTTON}>
              Reset Hunter to Level 1
            </button>
            <button type="button" onClick={dev.clearGateHistory} className={BUTTON}>
              Clear Cleared-Gates History
            </button>
          </div>
          <NumberAction
            id="dev-level"
            label="Set level:"
            button="Set level"
            initial={hunter.level || 1}
            min={1}
            onApply={dev.jumpToLevel}
          />
          <NumberAction
            id="dev-tickets"
            label="Lottery tickets:"
            button="Grant tickets"
            initial={3}
            min={0}
            onApply={dev.grantTickets}
          />
          <NumberAction
            id="dev-streak"
            label="Streak (days):"
            button="Set streak"
            initial={7}
            min={0}
            onApply={dev.setStreak}
          />
          <p className="text-[10px] text-text-muted">
            Set streak rewrites the daily XP history to end today. To see the streak bonus ticket:
            set it to 7, then claim any quest.
          </p>
          <div className="text-[10px] text-text-muted" data-testid="dev-current">
            Current: Level {hunter.level || 1} · {hunter.xp || 0} XP ·{' '}
            {(hunter.clearedGates || []).length} gate(s) cleared · {hunter.tickets ?? 0} ticket(s) ·{' '}
            {currentStreak(hunter.dailyXP ?? {})}-day streak · ranks open:{' '}
            {ranks.length > 0 ? ranks.join(' ') : 'none'}
          </div>
        </div>
      )}
    </div>
  )
}
