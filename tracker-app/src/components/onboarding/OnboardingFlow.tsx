import { useState } from 'react'
import { cn } from '../../lib/cn'
import type { StatKey } from '../../lib/hunterState'
import { FOCUS_OPTIONS } from '../../lib/onboarding'
import { Button } from '../ui'

export interface OnboardingFlowProps {
  onComplete: (name: string, focusStat: StatKey | null) => void
}

type Step = 'name' | 'focus'

const DEFAULT_FOCUS_KEY = 'balanced'

// First-launch only (gated on hunter.name being empty — see App.tsx). Two
// screens, completable in a handful of taps: a name, then a cosmetic
// "focus" pick. Both are skippable — this is about making day one feel
// like a choice, not about collecting real data.
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [focusKey, setFocusKey] = useState(DEFAULT_FOCUS_KEY)

  const finish = (chosenFocusKey: string) => {
    const focusStat = FOCUS_OPTIONS.find((o) => o.key === chosenFocusKey)?.statKey ?? null
    onComplete(name, focusStat)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg px-6 py-10 text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        {step === 'name' ? (
          <div>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={() => finish(DEFAULT_FOCUS_KEY)}
                className="cursor-pointer text-xs font-bold text-text-muted hover:text-text-secondary"
              >
                Skip intro
              </button>
            </div>
            <div className="text-4xl" aria-hidden="true">
              🔰
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-text-primary">
              What should we call you, Hunter?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Every System Window needs a name at the top.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setStep('focus')
              }}
              placeholder="Your name"
              className="mt-6 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <Button onClick={() => setStep('focus')} className="mt-6 w-full">
              Continue
            </Button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setStep('name')}
              className="mb-6 cursor-pointer text-xs font-bold text-text-muted hover:text-text-secondary"
            >
              ← back
            </button>
            <div className="text-4xl" aria-hidden="true">
              🎯
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-text-primary">Pick your focus</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Just for flavor — a small visual nod to what you're here for.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {FOCUS_OPTIONS.map((opt) => {
                const selected = focusKey === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFocusKey(opt.key)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                      selected
                        ? 'border-accent bg-accent-muted shadow-glow-accent'
                        : 'border-border bg-surface-2 hover:border-border-strong',
                    )}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {opt.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-text-primary">
                        {opt.label}
                      </span>
                      <span className="block text-xs text-text-secondary">{opt.description}</span>
                    </span>
                    {selected && (
                      <span className="shrink-0 text-accent" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <Button onClick={() => finish(focusKey)} className="mt-6 w-full">
              Start Hunting
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
