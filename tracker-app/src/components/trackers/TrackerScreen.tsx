import { useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useAndroidBackAction } from '../../hooks/useAndroidBackAction'
import type { TrackerList } from '../../hooks/useTracker'
import { cn } from '../../lib/cn'
import { sortTrackerItems, type TrackerDef, type TrackerDraft } from '../../lib/trackers'
import { NestedBackButton, ScreenBackground } from '../ui'
import { FAB_CLASS } from '../ui/formStyles'
import { TrackerSheet } from './TrackerSheet'

export interface TrackerScreenProps {
  def: TrackerDef
  list: TrackerList
  onBack: () => void
}

type SheetState = { mode: 'add' } | { mode: 'edit'; id: string } | null

// One screen for every simple tracker (Skills, Certs, Projects): the same
// glass cards, "+" to add and tap-to-edit as Job Search, with what each
// card shows coming from the tracker's definition (lib/trackers.ts).
export function TrackerScreen({ def, list, onBack }: TrackerScreenProps) {
  const [sheet, setSheet] = useState<SheetState>(null)
  useAndroidBackAction(sheet !== null, () => setSheet(null), 100)
  const sorted = useMemo(() => sortTrackerItems(list.items), [list.items])
  const editing = sheet?.mode === 'edit' ? list.items.find((i) => i.id === sheet.id) : undefined
  const now = new Date()
  const count = list.items.length

  const save = (draft: TrackerDraft) => {
    const ok = sheet?.mode === 'edit' ? list.update(sheet.id, draft) : Boolean(list.add(draft))
    if (ok) setSheet(null)
  }

  return (
    <ScreenBackground screen="generic" className="px-4 pt-6 pb-28 text-text-primary sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <NestedBackButton onClick={onBack} />
        <h1 className="mt-3 text-xl font-extrabold text-text-primary">
          {def.icon} {def.title}
        </h1>
        <p className="mt-1 mb-5 text-sm text-text-secondary">
          {count} {count === 1 ? def.singular : def.plural}
        </p>

        {sorted.length === 0 ? (
          <div className="hud-glass rounded-2xl p-6 text-center">
            <div className="hud-icon mx-auto h-14 w-14 text-3xl" aria-hidden="true">
              {def.icon}
            </div>
            <div className="mt-3 text-base font-extrabold text-text-primary">No {def.plural} yet</div>
            <p className="mt-1 text-sm text-text-secondary">Tap + to add the first one.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((item, i) => {
              const view = def.card(item, now)
              return (
                <li
                  key={item.id}
                  className="hud-glass hud-enter overflow-hidden rounded-2xl"
                  style={{ '--i': Math.min(i, 8) } as CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setSheet({ mode: 'edit', id: item.id })}
                    aria-label={`Edit ${item.title}`}
                    className="hud-pressable block w-full cursor-pointer px-4 py-3.5 text-left"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold break-words text-text-primary">
                          {item.title}
                        </span>
                        {view.subtitle && (
                          <span className="block text-xs break-words text-text-secondary">
                            {view.subtitle}
                          </span>
                        )}
                      </span>
                      {view.pill && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase',
                            view.pill.className,
                          )}
                        >
                          {view.pill.label}
                        </span>
                      )}
                    </span>
                    {view.meta && (
                      <span className="mt-1.5 block text-[11px] text-text-muted">{view.meta}</span>
                    )}
                    {view.note && (
                      <span className="mt-1.5 line-clamp-2 block text-xs text-text-secondary">
                        {view.note}
                      </span>
                    )}
                  </button>
                  {view.link && (
                    <a
                      href={view.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border-t border-hairline px-4 py-2 text-xs font-bold text-accent-hover hover:underline"
                    >
                      {view.link.label} ↗
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSheet({ mode: 'add' })}
        aria-label={`Add ${def.singular}`}
        className={FAB_CLASS}
      >
        +
      </button>

      {/* Portalled to <body> so the sheet covers the bottom tab bar. */}
      {sheet?.mode === 'add' &&
        createPortal(<TrackerSheet def={def} onSave={save} onClose={() => setSheet(null)} />, document.body)}
      {sheet?.mode === 'edit' &&
        editing &&
        createPortal(
          <TrackerSheet
            key={editing.id}
            def={def}
            editing={editing}
            onSave={save}
            onDelete={() => {
              list.remove(editing.id)
              setSheet(null)
            }}
            onClose={() => setSheet(null)}
          />,
          document.body,
        )}
    </ScreenBackground>
  )
}
