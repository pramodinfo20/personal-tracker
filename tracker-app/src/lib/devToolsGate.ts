// The ONE gate for the Dev Testing tools. Both locks use it — the panel's
// visibility (ProfileSheet) and the dev actions themselves (useHunter) — so
// they can never drift apart.
//
// Enabled when:
//   - it's a dev build (npm run dev, tests), or
//   - the build was made with VITE_ENABLE_DEV_TOOLS=true AND this browser
//     has been unlocked.
//
// To turn the tools on for the live site, temporarily:
//   Vercel -> Project -> Settings -> Environment Variables (Production):
//   add VITE_ENABLE_DEV_TOOLS = true, then redeploy.
//   Then open the site once with ?devtools=1 in the address — that unlocks
//   THIS browser only (a localStorage flag); the parameter is removed from
//   the address bar. ?devtools=0 locks it again.
// To turn them off for good: delete that variable in Vercel and redeploy.
// No code change either way. The flag is never set in this repo.
//
// With the variable on, ordinary visitors still never see the panel: they
// have not unlocked their browser. With it off, unlocking does nothing.

/** localStorage flag set by ?devtools=1. Describes this browser, not the save (so not a p26_* key, not backed up). */
export const DEVTOOLS_UNLOCK_KEY = 'hunter.devtoolsUnlocked'
/** The URL parameter: ?devtools=1 unlocks, ?devtools=0 locks. */
export const DEVTOOLS_PARAM = 'devtools'

export interface DevToolsBuild {
  /** import.meta.env.DEV */
  dev: boolean
  /** import.meta.env.VITE_ENABLE_DEV_TOOLS */
  flag: string | undefined
}

// The rule itself, as a pure function (this is what the tests exercise).
export const devToolsEnabledFor = (build: DevToolsBuild, unlocked: boolean): boolean =>
  build.dev || (build.flag === 'true' && unlocked)

type ReadStore = Pick<Storage, 'getItem'>

export const isDevToolsUnlocked = (store: ReadStore = localStorage): boolean => {
  try {
    return store.getItem(DEVTOOLS_UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

const thisBuild = (): DevToolsBuild => ({
  dev: import.meta.env.DEV,
  flag: import.meta.env.VITE_ENABLE_DEV_TOOLS as string | undefined,
})

/** Are the Dev Testing tools available right now, in this build and this browser? */
export const isDevToolsEnabled = (): boolean => devToolsEnabledFor(thisBuild(), isDevToolsUnlocked())

/** A production (live) build — where the panel shows its "real data" warning. */
export const isLiveBuild = (): boolean => !import.meta.env.DEV

// Handle ?devtools=1 / ?devtools=0 once at startup: set or clear the unlock
// flag, then remove the parameter from the address bar (keeping any other
// parameters and the hash). Any other value is ignored and left alone.
// Returns what it did, for tests.
export const applyDevToolsParam = (
  location: Pick<Location, 'href'> = window.location,
  history: Pick<History, 'replaceState'> = window.history,
  store: Pick<Storage, 'setItem' | 'removeItem'> = localStorage,
): 'unlocked' | 'locked' | null => {
  let url: URL
  try {
    url = new URL(location.href)
  } catch {
    return null
  }
  const value = url.searchParams.get(DEVTOOLS_PARAM)
  if (value !== '1' && value !== '0') return null
  try {
    if (value === '1') store.setItem(DEVTOOLS_UNLOCK_KEY, '1')
    else store.removeItem(DEVTOOLS_UNLOCK_KEY)
  } catch {
    // Storage unavailable: nothing to unlock with; still tidy the address.
  }
  url.searchParams.delete(DEVTOOLS_PARAM)
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  return value === '1' ? 'unlocked' : 'locked'
}
