// The intro splash shown before setup on a genuinely first launch: when it
// should appear, and remembering that it has.
//
// "First launch" is the same test setup uses (no saved hunter name — see
// App.tsx). The seen-marker below adds "and only once": reloading half-way
// through setup doesn't replay the splash. It describes this device, not
// the save, so it isn't a p26_* key and isn't part of a backup.

export const INTRO_SEEN_KEY = 'tracker_intro_seen'

/** How long the splash stays before moving on by itself. */
export const INTRO_MS = 2800

type Store = Pick<Storage, 'getItem' | 'setItem'>

export const shouldShowIntro = (hunterName: string, store: Store): boolean => {
  if (hunterName.trim()) return false // an existing save never sees it
  try {
    return store.getItem(INTRO_SEEN_KEY) === null
  } catch {
    return false
  }
}

export const markIntroSeen = (store: Store): void => {
  try {
    store.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // Storage unavailable: the splash may show again next launch — harmless.
  }
}
