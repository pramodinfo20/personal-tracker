import { useState } from 'react'
import { Badge, Button, Card, CountdownTimer, ProgressBar, TIERS } from './components/ui'

/**
 * ⚠️ TEMPORARY PREVIEW — NOT A REAL SCREEN ⚠️
 * This renders one of each src/components/ui component with sample data so
 * the design system can be eyeballed before any real screens are built.
 * Delete this and replace with the actual Hunter Status / Shadow Army /
 * Gate / Daily Quests screens in the next phase.
 */
function App() {
  const [gateExpiresAt] = useState(() => Date.now() + 45 * 60 * 1000)
  const [soonExpiresAt] = useState(() => Date.now() + 40 * 1000)

  return (
    <div className="min-h-screen bg-bg px-6 py-10 text-text-primary">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="rounded-lg border border-dashed border-warning/50 bg-warning/10 px-4 py-2 font-mono text-xs text-warning">
          TEMP PREVIEW — src/App.tsx will be replaced with real screens next phase
        </div>

        <header>
          <h1 className="font-sans text-2xl font-extrabold tracking-tight text-text-primary">
            Design System Preview
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Button, Card, ProgressBar, Badge, CountdownTimer
          </p>
        </header>

        <Card title="Buttons" icon="🔘">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Start Gate</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary" disabled>
              Locked
            </Button>
          </div>
        </Card>

        <Card title="Hunter Status" icon="🧙" glow>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-2xl font-bold text-accent">Level 24</div>
              <div className="text-sm text-text-secondary">A-Rank Hunter</div>
            </div>
            <Badge tier="purple">A-Rank</Badge>
          </div>
          <div className="mt-4">
            <ProgressBar value={959} max={1724} />
          </div>
        </Card>

        <Card title="Rank-Tier Badges" icon="🏷️">
          <div className="flex flex-wrap gap-2">
            {TIERS.map((tier) => (
              <Badge key={tier} tier={tier}>
                {tier}
              </Badge>
            ))}
          </div>
        </Card>

        <Card title="Gate — Live Countdown" icon="🌀" interactive>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Expires in</span>
            <CountdownTimer expiresAt={gateExpiresAt} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Urgent (&lt;60s)</span>
            <CountdownTimer expiresAt={soonExpiresAt} />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default App
