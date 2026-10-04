// The saved list behind one simple tracker (Skills, Certs, Projects — see
// lib/trackers.ts). Same useSaved-backed pattern as useJobApplications,
// written once and driven by the tracker's definition.

import {
  trackerDraftToFields,
  validateTrackerDraft,
  type TrackerDef,
  type TrackerDraft,
  type TrackerItem,
} from '../lib/trackers'
import { useSaved } from './useSaved'

const newId = (def: TrackerDef): string =>
  `${def.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export interface TrackerList {
  items: TrackerItem[]
  /** Returns the created item, or null for a draft that isn't valid. */
  add: (draft: TrackerDraft) => TrackerItem | null
  update: (id: string, draft: TrackerDraft) => boolean
  remove: (id: string) => void
}

export function useTracker(def: TrackerDef): TrackerList {
  const [items, setItems] = useSaved<TrackerItem[]>(def.storageKey, [])
  const isValid = (draft: TrackerDraft) => Object.keys(validateTrackerDraft(def, draft)).length === 0

  const add = (draft: TrackerDraft): TrackerItem | null => {
    if (!isValid(draft)) return null
    const created = {
      ...trackerDraftToFields(def, draft),
      id: newId(def),
      createdAt: new Date().toISOString(),
    } as TrackerItem
    setItems((list) => [...list, created])
    return created
  }

  const update = (id: string, draft: TrackerDraft): boolean => {
    if (!isValid(draft)) return false
    setItems((list) =>
      list.map((item) =>
        item.id === id
          ? ({ ...trackerDraftToFields(def, draft), id: item.id, createdAt: item.createdAt } as TrackerItem)
          : item,
      ),
    )
    return true
  }

  const remove = (id: string) => {
    setItems((list) => list.filter((item) => item.id !== id))
  }

  return { items, add, update, remove }
}
