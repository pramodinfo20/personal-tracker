import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useClaimCelebration } from '../../hooks/useClaimCelebration'
import { useAndroidBackAction } from '../../hooks/useAndroidBackAction'
import {
  ACTIVITY_CATEGORIES,
  activitiesIn,
  activityCategory,
  type Activity,
  type ActivityCategoryKey,
} from '../../lib/activities'
import { activityImage } from '../../lib/activityImages'
import { questIcon } from '../../lib/customQuests'
import { STAT_META } from '../../lib/hunterState'
import { DAILY_LOG_CAP, formatTierXPRange, type XPTier } from '../../lib/quests'
import { Button } from '../ui'
import { ActivityCard } from './ActivityCard'
import { TierPicker } from './TierPicker'

interface LogModeProps {
  /** Opened from the Today screen's "+": picking a tier claims it right away. */
  mode: 'log'
  logCount: number
  onLog: (activityId: string, tier: XPTier, note: string) => void
}

interface RecurringModeProps {
  /** Opened from My Quests' "+ Add Quest": saves the activity as a recurring quest. */
  mode: 'recurring'
  onAddQuest: (activityId: string) => void
}

export type ActivityPickerSheetProps = (LogModeProps | RecurringModeProps) & {
  onClose: () => void
}

// The one way to add or log anything outside the 5 fixed quests:
// category -> activity -> tier, all from ACTIVITY_LIBRARY. Every tier is
// fixed; there's no XP input anywhere in this flow. The two entry points
// differ only at step 3 — see the mode props above.
export function ActivityPickerSheet(props: ActivityPickerSheetProps) {
  const { mode, onClose } = props
  const [categoryKey, setCategoryKey] = useState<ActivityCategoryKey | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [note, setNote] = useState('')
  const { celebrating, celebrate } = useClaimCelebration<string>()

  const step = activity ? 3 : categoryKey ? 2 : 1
  const capReached = props.mode === 'log' && props.logCount >= DAILY_LOG_CAP
  const title = mode === 'log' ? '📝 Log an Activity' : '🗒️ Add a Quest'
  const stepHint =
    step === 1
      ? 'Pick a category'
      : step === 2
        ? 'Pick an activity'
        : mode === 'log'
          ? 'How much?'
          : 'Review tiers'

  const back = () => {
    if (activity) setActivity(null)
    else setCategoryKey(null)
  }

  useAndroidBackAction(true, () => {
    if (step > 1) back()
    else onClose()
  }, 200)

  const logTier = (tier: XPTier) => {
    if (props.mode !== 'log' || !activity || capReached) return
    props.onLog(activity.id, tier, note)
    // Close only once the claim feedback on the tapped tier has played.
    celebrate(tier.label, tier.xp, onClose)
  }

  const addQuest = () => {
    if (props.mode !== 'recurring' || !activity) return
    props.onAddQuest(activity.id)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={mode === 'log' ? 'Log an activity' : 'Add a quest'}
        className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-gradient-to-b from-surface to-surface-2 shadow-panel sm:max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  aria-label="Back"
                  className="cursor-pointer text-xl leading-none text-text-muted hover:text-text-primary"
                >
                  ‹
                </button>
              )}
              <h2 className="truncate text-sm font-bold tracking-wide text-text-primary uppercase">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-2xl leading-none text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mb-4 text-[11px] font-bold text-text-muted">
            Step {step} of 3 · {stepHint}
          </div>
        </div>

        <div
          data-testid="activity-picker-scroll"
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          {capReached ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-text-muted">
              You've logged your {DAILY_LOG_CAP} activities for today.
            </div>
          ) : step === 1 ? (
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_CATEGORIES.map((c) => {
                const count = activitiesIn(c.key).length
                return (
                  <ActivityCard
                    key={c.key}
                    title={c.label}
                    subtitle={`${count} ${count === 1 ? 'activity' : 'activities'}`}
                    glyph={c.icon}
                    gradient={c.gradient}
                    onClick={() => setCategoryKey(c.key)}
                  />
                )
              })}
            </div>
          ) : step === 2 && categoryKey ? (
            <>
              <div className="mb-3 text-xs font-bold text-text-secondary">
                {activityCategory(categoryKey).icon} {activityCategory(categoryKey).label}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {activitiesIn(categoryKey).map((a) => (
                  <ActivityCard
                    key={a.id}
                    title={a.name}
                    subtitle={`${formatTierXPRange(a.tiers)} XP · ${a.statKey}`}
                    glyph={questIcon(a.iconKey)}
                    gradient={a.gradient}
                    image={activityImage(a.id)}
                    onClick={() => setActivity(a)}
                  />
                ))}
              </div>
            </>
          ) : activity ? (
            <>
              <ActivityCard
                size="banner"
                title={activity.name}
                subtitle={`${activityCategory(activity.category).label} · ${STAT_META.find((s) => s.key === activity.statKey)?.icon} ${activity.statKey}`}
                glyph={questIcon(activity.iconKey)}
                gradient={activity.gradient}
                image={activityImage(activity.id)}
              />
              {props.mode === 'log' ? (
                <div className="mt-4">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (optional) — e.g. Riverside loop"
                    className="mb-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                  <TierPicker tiers={activity.tiers} onPick={logTier} celebrating={celebrating} />
                  <div className="mt-2 text-[10px] text-text-muted">
                    {props.logCount}/{DAILY_LOG_CAP} logged today · tap a tier to log it
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-text-secondary">
                    Added as a daily quest — each day you'll pick one of these when you claim it.
                  </p>
                  <ul className="mb-4 divide-y divide-border rounded-xl border border-border">
                    {activity.tiers.map((t) => (
                      <li key={t.label} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="font-bold text-text-primary">{t.label}</span>
                        <span className="font-mono text-xs font-bold text-accent">+{t.xp} XP</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={addQuest} className="w-full">
                    Add to My Quests
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
