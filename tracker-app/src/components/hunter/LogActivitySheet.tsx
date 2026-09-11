import type { StatKey } from '../../lib/hunterState'
import type { LogXPTier } from '../../lib/quests'
import { LogActivityForm } from './LogActivityForm'

export interface LogActivitySheetProps {
  logCount: number
  onLog: (tier: LogXPTier, label: string, stat: StatKey) => void
  onClose: () => void
}

export function LogActivitySheet({ logCount, onLog, onClose }: LogActivitySheetProps) {
  const handleLog = (tier: LogXPTier, label: string, stat: StatKey) => {
    onLog(tier, label, stat)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-t-3xl border border-b-0 border-border bg-gradient-to-b from-surface to-surface-2 p-5 pb-8 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">
            📝 Log an Activity
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
        <LogActivityForm logCount={logCount} onLog={handleLog} bare />
      </div>
    </div>
  )
}
