import { useMemo, useState } from 'react'
import {
  HEAT_LEVELS,
  formatFullDay,
  formatPageRange,
  heatmapPage,
  maxHeatmapPage,
} from '../../lib/calendar'
import { cn } from '../../lib/cn'
import { today } from '../../lib/format'
import { formatDayLabel, statBreakdown, unattributedXPInRange } from '../../lib/progress'
import type { DailyStatXP } from '../../lib/statHistory'
import { StatBreakdown } from '../progress/StatBreakdown'
import { NestedBackButton, ScreenBackground } from '../ui'

export interface CalendarScreenProps {
  dailyXP: Record<string, number>
  dailyStatXP: DailyStatXP | undefined
  onBack: () => void
}

// The accent colour at rising strength — theme-aware, since --color-accent
// is redefined per theme. Level 0 is the same neutral track the progress
// bars use.
const LEVEL_CLASS = [
  'border border-hairline bg-track',
  'bg-accent/25',
  'bg-accent/50',
  'bg-accent/75',
  'bg-accent',
]

const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const PAGER =
  'cursor-pointer rounded-lg border border-border bg-backing/40 px-2.5 py-1.5 text-xs font-bold text-text-primary disabled:cursor-default disabled:opacity-40'

// More → Calendar: a GitHub-style heatmap of XP per day, ~12 weeks at a
// time, with paging back through earlier history. Tapping a day shows that
// day's total and per-stat breakdown underneath.
export function CalendarScreen({ dailyXP, dailyStatXP, onBack }: CalendarScreenProps) {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string>(() => today())
  const view = useMemo(() => heatmapPage(dailyXP, page), [dailyXP, page])
  const maxPage = useMemo(() => maxHeatmapPage(dailyXP), [dailyXP])

  // The selected day, through the Progress screen's own breakdown logic —
  // a one-day range ending on that day.
  const selectedEnd = new Date(`${selected}T12:00:00.000Z`)
  const history = dailyStatXP ?? {}
  const breakdown = statBreakdown(history, 1, selectedEnd)
  const dayXP = dailyXP[selected] ?? 0
  const gateXP = history[selected]?.GATE ?? 0
  const unattributed = unattributedXPInRange(dailyXP, history, 1, selectedEnd)
  const hasEntry = selected in dailyXP

  return (
    <ScreenBackground screen="generic" className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <NestedBackButton onClick={onBack} />
          <h1 className="mt-3 text-xl font-extrabold text-text-primary">🗓️ Calendar</h1>
          <p className="mt-1 text-sm text-text-secondary">XP earned each day. Tap a day for details.</p>
        </div>

        <section className="hud-glass rounded-2xl p-4" aria-label="Activity heatmap">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage}
              aria-label="Earlier weeks"
              className={PAGER}
            >
              ‹ Earlier
            </button>
            <div className="min-w-0 text-center text-xs font-bold text-text-primary" aria-live="polite">
              {formatPageRange(view)}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Later weeks"
              className={PAGER}
            >
              Later ›
            </button>
          </div>

          {/* A label column, then one column per week; rows are Mon..Sun. */}
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `auto repeat(${view.weeks.length}, minmax(0, 1fr))` }}
          >
            <span />
            {view.monthLabels.map((label, i) => (
              <span key={i} className="h-4 overflow-visible text-[10px] whitespace-nowrap text-text-muted">
                {label}
              </span>
            ))}
            {WEEKDAYS.map((weekday, row) => (
              <div key={row} className="contents">
                <span className="pr-1 text-[10px] leading-none text-text-muted" aria-hidden="true">
                  <span className="flex h-full items-center">{weekday}</span>
                </span>
                {view.weeks.map((week) => {
                  const cell = week[row]
                  if (cell.future) return <span key={cell.date} className="aspect-square" />
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => setSelected(cell.date)}
                      aria-label={`${formatDayLabel(cell.date)}: ${cell.xp} XP`}
                      aria-pressed={selected === cell.date}
                      data-level={cell.level}
                      className={cn(
                        'aspect-square cursor-pointer rounded-[4px]',
                        LEVEL_CLASS[cell.level],
                        cell.today && 'ring-1 ring-text-secondary',
                        selected === cell.date && 'ring-2 ring-text-primary',
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary">
            <span>
              {view.activeDays} active {view.activeDays === 1 ? 'day' : 'days'} ·{' '}
              <span className="font-mono font-bold text-text-primary">{view.totalXP}</span> XP
            </span>
            <span className="flex items-center gap-1" aria-hidden="true">
              Less
              {Array.from({ length: HEAT_LEVELS + 1 }, (_, level) => (
                <span key={level} className={cn('h-3 w-3 rounded-[3px]', LEVEL_CLASS[level])} />
              ))}
              More
            </span>
          </div>
        </section>

        <section className="hud-glass rounded-2xl p-4" aria-label="Selected day">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold text-text-primary">{formatFullDay(selected)}</h2>
            <span className="font-mono text-sm font-bold text-accent-hover">{dayXP} XP</span>
          </div>
          {dayXP > 0 ? (
            <div className="mt-3">
              <StatBreakdown data={breakdown} />
              {gateXP > 0 && (
                <p className="mt-3 text-[11px] text-text-secondary">
                  Includes {gateXP} XP from a gate bonus, which isn't tied to a stat.
                </p>
              )}
              {unattributed > 0 && (
                <p className="mt-3 text-[11px] text-text-muted">
                  {unattributed} XP on this day was earned before per-stat history was kept, so it
                  isn't split by stat here.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-text-secondary">
              {hasEntry ? 'Active, but no XP earned this day.' : 'No activity this day.'}
            </p>
          )}
        </section>
      </div>
    </ScreenBackground>
  )
}
