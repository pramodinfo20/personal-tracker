import { useState } from 'react'
import {
  QUEST_CATEGORIES,
  QUEST_ICONS,
  questCategory,
  type CustomQuest,
  type CustomQuestTier,
  type QuestCategoryKey,
} from '../../lib/customQuests'
import { STAT_META, type StatKey } from '../../lib/hunterState'
import type { NewCustomQuest } from '../../hooks/useCustomQuests'
import { cn } from '../../lib/cn'
import { Button } from '../ui'

export interface QuestFormProps {
  /** Present when editing an existing quest; absent when creating a new one. */
  initial?: CustomQuest
  onSave: (quest: NewCustomQuest) => void
  onCancel: () => void
}

// Add/edit form for a custom quest: pick a category (prefills tiers + stat
// + icon), then edit freely before saving. Plain inputs matching
// LogActivityForm's style — no new visual language introduced here.
export function QuestForm({ initial, onSave, onCancel }: QuestFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<QuestCategoryKey>(initial?.category ?? QUEST_CATEGORIES[0].key)
  const [iconKey, setIconKey] = useState(initial?.iconKey ?? QUEST_CATEGORIES[0].iconKey)
  const [statKey, setStatKey] = useState<StatKey>(initial?.statKey ?? QUEST_CATEGORIES[0].statKey)
  const [tiers, setTiers] = useState<CustomQuestTier[]>(
    initial?.tiers ?? QUEST_CATEGORIES[0].defaultTiers.map((t) => ({ ...t })),
  )

  const applyCategory = (key: QuestCategoryKey) => {
    const preset = questCategory(key)
    setCategory(key)
    setIconKey(preset.iconKey)
    setStatKey(preset.statKey)
    setTiers(preset.defaultTiers.map((t) => ({ ...t })))
  }

  const setTierLabel = (i: number, label: string) => {
    setTiers((ts) => ts.map((t, idx) => (idx === i ? { ...t, label } : t)))
  }

  const setTierXp = (i: number, xp: number) => {
    setTiers((ts) => ts.map((t, idx) => (idx === i ? { ...t, xp } : t)))
  }

  const removeTier = (i: number) => {
    setTiers((ts) => ts.filter((_, idx) => idx !== i))
  }

  const addTier = () => {
    setTiers((ts) => [...ts, { label: '', xp: 10 }])
  }

  const validTiers = tiers.filter((t) => t.label.trim().length > 0 && t.xp > 0)
  const canSave = name.trim().length > 0 && validTiers.length > 0

  const save = () => {
    if (!canSave) return
    onSave({ name: name.trim(), category, iconKey, statKey, tiers: validTiers })
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4">
      <div className="mb-3">
        <label className="mb-1 block text-[10px] font-bold text-text-muted uppercase">Category</label>
        <div className="flex flex-wrap gap-2">
          {QUEST_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => applyCategory(c.key)}
              className={cn(
                'cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors',
                category === c.key
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border bg-surface text-text-secondary hover:text-text-primary',
              )}
            >
              {QUEST_ICONS[c.iconKey]} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-[10px] font-bold text-text-muted uppercase">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning Stretch"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-bold text-text-muted uppercase">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(QUEST_ICONS).map(([key, emoji]) => (
              <button
                key={key}
                type="button"
                aria-label={key}
                aria-pressed={iconKey === key}
                onClick={() => setIconKey(key)}
                className={cn(
                  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-base transition-colors',
                  iconKey === key
                    ? 'border-accent bg-accent-muted'
                    : 'border-border bg-surface hover:border-border-strong',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold text-text-muted uppercase">Stat</label>
          <select
            value={statKey}
            onChange={(e) => setStatKey(e.target.value as StatKey)}
            className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {STAT_META.map((s) => (
              <option key={s.key} value={s.key}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-[10px] font-bold text-text-muted uppercase">Tiers</label>
        <div className="flex flex-col gap-2">
          {tiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={tier.label}
                onChange={(e) => setTierLabel(i, e.target.value)}
                placeholder="Label"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                min={1}
                value={tier.xp}
                onChange={(e) => setTierXp(i, Number(e.target.value))}
                className="w-16 shrink-0 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <span className="shrink-0 text-xs text-text-muted">XP</span>
              <button
                type="button"
                onClick={() => removeTier(i)}
                aria-label={`Remove tier ${i + 1}`}
                className="shrink-0 cursor-pointer px-1.5 text-lg leading-none text-text-muted hover:text-warning"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTier}
          className="mt-2 cursor-pointer text-xs font-bold text-accent hover:text-accent-hover"
        >
          + Add tier
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!canSave} onClick={save}>
          {initial ? 'Save changes' : 'Add quest'}
        </Button>
      </div>
    </div>
  )
}
