import { useState } from 'react'
import { nextResetAt } from '../../lib/format'
import { CountdownTimer } from '../ui'

// Daily quests roll over at the next UTC midnight (see useHunter's
// lastQuestDate effect) — this just makes that boundary visible. Rolls
// itself to the following day automatically via CountdownTimer's onExpire,
// so it keeps ticking correctly even across the reset instant.
export function QuestsResetTimer() {
  const [resetAt, setResetAt] = useState(() => nextResetAt())

  return (
    <div className="flex items-center justify-between gap-2 px-1 text-xs text-text-secondary">
      <span className="font-bold">Quests reset in</span>
      <CountdownTimer
        expiresAt={resetAt}
        onExpire={() => setResetAt(nextResetAt())}
        urgentThresholdMs={0}
        variant="compact"
      />
    </div>
  )
}
