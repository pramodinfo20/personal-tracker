import { useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import {
  JOB_STATUS_LABEL,
  applicationStats,
  applicationsOn,
  formatAppliedDate,
  huntTierForActions,
  localDateKey,
  sortApplications,
  type JobApplication,
  type JobApplicationDraft,
} from '../../lib/jobApplications'
import type { XPTier } from '../../lib/quests'
import { ScreenBackground } from '../ui'
import { JobApplicationSheet } from './JobApplicationSheet'
import { STATUS_PILL } from './statusPill'

export interface JobSearchScreenProps {
  applications: JobApplication[]
  onAdd: (draft: JobApplicationDraft) => JobApplication | null
  onUpdate: (id: string, draft: JobApplicationDraft) => boolean
  onDelete: (id: string) => void
  /** Whether the Hunter Association quest is already claimed today. */
  huntClaimedToday: boolean
  /** Claims the Hunter Association quest at this tier — the normal quest claim. */
  onClaimHunt: (tier: XPTier) => void
  onBack: () => void
}

type SheetState = { mode: 'add' } | { mode: 'edit'; id: string } | null

// The Job Search tracker (More → Job Search): applications as cards, newest
// first, with a "+" to add and a tap to edit.
export function JobSearchScreen({
  applications,
  onAdd,
  onUpdate,
  onDelete,
  huntClaimedToday,
  onClaimHunt,
  onBack,
}: JobSearchScreenProps) {
  const [sheet, setSheet] = useState<SheetState>(null)
  const sorted = useMemo(() => sortApplications(applications), [applications])
  const stats = applicationStats(applications)
  const editing = sheet?.mode === 'edit' ? applications.find((a) => a.id === sheet.id) : undefined

  // The tier a claim would use: today's applications, counting the new one.
  const questTier = huntClaimedToday
    ? null
    : huntTierForActions(applicationsOn(applications, localDateKey()) + 1)

  const save = (draft: JobApplicationDraft, claimQuest: boolean) => {
    if (sheet?.mode === 'edit') {
      if (onUpdate(sheet.id, draft)) setSheet(null)
      return
    }
    if (!onAdd(draft)) return
    if (claimQuest && questTier) onClaimHunt(questTier)
    setSheet(null)
  }

  return (
    <ScreenBackground screen="generic" className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-xs font-bold text-text-secondary hover:text-text-primary"
        >
          ‹ More
        </button>
        <h1 className="mt-2 text-xl font-extrabold text-text-primary">💼 Job Search</h1>

        <dl className="mt-4 mb-5 grid grid-cols-2 gap-3" aria-label="Applications sent">
          {[
            { label: 'This week', value: stats.thisWeek },
            { label: 'This month', value: stats.thisMonth },
          ].map((s) => (
            <div key={s.label} className="hud-glass rounded-2xl px-4 py-3">
              <dd className="font-mono text-2xl font-black text-text-primary">{s.value}</dd>
              <dt className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>

        {sorted.length === 0 ? (
          <div className="hud-glass rounded-2xl p-6 text-center">
            <div className="hud-icon mx-auto h-14 w-14 text-3xl" aria-hidden="true">
              💼
            </div>
            <div className="mt-3 text-base font-extrabold text-text-primary">No applications yet</div>
            <p className="mt-1 text-sm text-text-secondary">Tap + to add the first one.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((a, i) => (
              <li
                key={a.id}
                className="hud-glass hud-enter overflow-hidden rounded-2xl"
                style={{ '--i': Math.min(i, 8) } as CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => setSheet({ mode: 'edit', id: a.id })}
                  aria-label={`Edit ${a.company}${a.role ? `, ${a.role}` : ''}`}
                  className="hud-pressable block w-full cursor-pointer px-4 py-3.5 text-left"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold text-text-primary">
                        {a.company}
                      </span>
                      {a.role && (
                        <span className="block truncate text-xs text-text-secondary">{a.role}</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                        STATUS_PILL[a.status],
                      )}
                    >
                      {JOB_STATUS_LABEL[a.status]}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[11px] text-text-muted">
                    Applied {formatAppliedDate(a.dateApplied)}
                  </span>
                  {a.notes && (
                    <span className="mt-1.5 line-clamp-2 block text-xs text-text-secondary">
                      {a.notes}
                    </span>
                  )}
                </button>
                {a.link && (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-t border-hairline px-4 py-2 text-xs font-bold text-accent-hover hover:underline"
                  >
                    Open posting ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSheet({ mode: 'add' })}
        aria-label="Add application"
        className="glow-accent fixed right-4 bottom-24 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(var(--rgb-accent-hover)),var(--color-accent)_55%,var(--color-accent-active))] text-3xl leading-none font-bold text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-8px_rgb(var(--rgb-shadow)/0.7),0_0_var(--hud-glow-spread)_rgb(var(--glow)/0.6)] transition-transform active:scale-95"
      >
        +
      </button>

      {/* Portalled to <body>: this screen sits below the bottom tab bar in
          the stacking order, and the sheet has to cover that bar. */}
      {sheet?.mode === 'add' &&
        createPortal(
          <JobApplicationSheet questTier={questTier} onSave={save} onClose={() => setSheet(null)} />,
          document.body,
        )}
      {sheet?.mode === 'edit' &&
        editing &&
        createPortal(
          <JobApplicationSheet
            key={editing.id}
            editing={editing}
            onSave={save}
            onDelete={() => {
              onDelete(editing.id)
              setSheet(null)
            }}
            onClose={() => setSheet(null)}
          />,
          document.body,
        )}
    </ScreenBackground>
  )
}
