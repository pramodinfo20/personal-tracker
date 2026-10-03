import { useState, type FormEvent } from 'react'
import type { ActivityCategoryKey } from '../../lib/activities'
import {
  BODY_FIELDS,
  GOAL_OPTIONS,
  parseOptionalNumber,
  type OnboardingResult,
} from '../../lib/onboarding'
import { screenBackgroundProps } from '../../lib/screenBackgrounds'
import { ActivityCard } from '../hunter/ActivityCard'
import { Button, ScreenBackground } from '../ui'

export interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void
  /**
   * Prefill for "Retake setup" (from Profile). Its presence switches the
   * flow into retake mode: cancellable, and it says that finishing resets
   * which built-in quests show on Today.
   */
  initial?: Partial<OnboardingResult>
  /** Retake mode only — first launch can't be dismissed. */
  onCancel?: () => void
}

type Step = 1 | 2 | 3
type BodyDraft = Record<'age' | 'heightCm' | 'weightKg', string>

const STEP_TITLES: Record<Step, string> = {
  1: 'What should we call you, Hunter?',
  2: 'A little about you',
  3: 'What are you here for?',
}

// First-launch setup (App gates it on hunter.name being empty) and the
// same flow reused for "Retake setup". Three steps: name (required), body
// details (optional, display-only), goals (pick at least one). The goals
// decide which built-in quests START enabled — see lib/onboarding.ts — and
// everything stays changeable in Manage Quests afterwards.
export function OnboardingFlow({ onComplete, initial, onCancel }: OnboardingFlowProps) {
  const retake = initial !== undefined
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState(initial?.name ?? '')
  const [body, setBody] = useState<BodyDraft>({
    age: initial?.age?.toString() ?? '',
    heightCm: initial?.heightCm?.toString() ?? '',
    weightKg: initial?.weightKg?.toString() ?? '',
  })
  const [goals, setGoals] = useState<ActivityCategoryKey[]>(initial?.goals ?? [])

  const parsedBody = BODY_FIELDS.map((f) => ({
    field: f,
    ...parseOptionalNumber(body[f.key], f.min, f.max),
  }))
  const nameOk = name.trim().length > 0
  const bodyOk = parsedBody.every((p) => p.valid)
  const goalsOk = goals.length > 0

  const toggleGoal = (key: ActivityCategoryKey) =>
    setGoals((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const finish = () => {
    if (!nameOk || !goalsOk) return
    const values = Object.fromEntries(parsedBody.map((p) => [p.field.key, p.value]))
    onComplete({ name: name.trim(), ...values, goals })
  }

  const submitName = (e: FormEvent) => {
    e.preventDefault()
    if (nameOk) setStep(2)
  }

  const submitBody = (e: FormEvent) => {
    e.preventDefault()
    if (bodyOk) setStep(3)
  }

  // "Skip" on the optional step discards whatever was typed there.
  const skipBody = () => {
    setBody({ age: '', heightCm: '', weightKg: '' })
    setStep(3)
  }

  return (
    <ScreenBackground {...screenBackgroundProps('generic')} layout="overlay" className="z-50">
      {/* The scroller and the centering box are separate: centering on the
          scroller itself would clip the top of the card on short screens. */}
      <div className="h-full overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-6">
          <div
            role="dialog"
            aria-label={retake ? 'Retake setup' : 'Welcome setup'}
            className="hud-glass hud-glass-strong hud-enter w-full max-w-md rounded-3xl p-6 text-text-primary"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as Step)}
                  className="cursor-pointer text-xs font-bold text-text-secondary hover:text-text-primary"
                >
                  ‹ Back
                </button>
              ) : retake && onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="cursor-pointer text-xs font-bold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              ) : (
                <span />
              )}
              {/* Step dots — decorative; the text beside them carries the meaning. */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-text-secondary">Step {step} of 3</span>
                <span className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={
                        n <= step
                          ? 'h-1.5 w-5 rounded-full bg-accent shadow-[0_0_8px_rgb(47_143_255/0.8)]'
                          : 'h-1.5 w-5 rounded-full bg-white/15'
                      }
                    />
                  ))}
                </span>
              </div>
            </div>

            <h1 className="hud-text-glow text-2xl leading-tight font-black">{STEP_TITLES[step]}</h1>

            {step === 1 && (
              <form onSubmit={submitName}>
                <p className="mt-2 text-sm text-text-secondary">
                  Every System Window needs a name at the top.
                </p>
                <label htmlFor="setup-name" className="sr-only">
                  Your name
                </label>
                <input
                  id="setup-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="Your name"
                  className="mt-5 w-full rounded-xl border border-border bg-black/40 px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
                <Button type="submit" disabled={!nameOk} className="mt-5 w-full">
                  Continue
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={submitBody}>
                <p className="mt-2 text-sm text-text-secondary">
                  Optional — shown on your profile only. Skip anything you'd rather not share.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {parsedBody.map(({ field, valid }) => (
                    <div key={field.key}>
                      <label
                        htmlFor={`setup-${field.key}`}
                        className="mb-1 block text-[11px] font-bold text-text-secondary"
                      >
                        {field.label} <span className="font-normal">({field.unit})</span>
                      </label>
                      <input
                        id={`setup-${field.key}`}
                        inputMode="decimal"
                        value={body[field.key]}
                        onChange={(e) => setBody((b) => ({ ...b, [field.key]: e.target.value }))}
                        aria-invalid={!valid}
                        placeholder="—"
                        className={
                          valid
                            ? 'w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none'
                            : 'w-full rounded-xl border border-warning bg-black/40 px-3 py-2.5 text-base text-text-primary focus:outline-none'
                        }
                      />
                    </div>
                  ))}
                </div>
                {!bodyOk && (
                  <p role="alert" className="mt-2 text-xs font-bold text-warning">
                    {parsedBody
                      .filter((p) => !p.valid)
                      .map((p) => `${p.field.label}: ${p.field.min}–${p.field.max} ${p.field.unit}`)
                      .join(' · ')}
                  </p>
                )}
                <div className="mt-5 flex gap-2">
                  <Button type="button" variant="secondary" onClick={skipBody} className="flex-1">
                    Skip
                  </Button>
                  <Button type="submit" disabled={!bodyOk} className="flex-1">
                    Continue
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div>
                <p className="mt-2 text-sm text-text-secondary">
                  Pick everything that applies. Your daily quests start from these — you can change
                  them any time in Manage Quests.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Goals">
                  {GOAL_OPTIONS.map((g) => (
                    <ActivityCard
                      key={g.key}
                      title={g.label}
                      subtitle={g.description}
                      glyph={g.category.icon}
                      gradient={g.category.gradient}
                      selected={goals.includes(g.key)}
                      onClick={() => toggleGoal(g.key)}
                    />
                  ))}
                </div>
                {retake && (
                  <p className="mt-3 text-xs text-text-secondary">
                    Finishing resets which built-in quests show on Today to match these goals. Your
                    XP, history and custom quests aren't affected.
                  </p>
                )}
                <Button onClick={finish} disabled={!goalsOk} className="mt-5 w-full">
                  {goalsOk ? (retake ? 'Save setup' : 'Start Hunting') : 'Pick at least one'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenBackground>
  )
}
