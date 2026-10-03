// Light/dark theming. The user's choice is 'system' | 'light' | 'dark'
// (default 'system' = follow prefers-color-scheme); what's actually applied
// is the resolved 'light' | 'dark', written as data-theme on <html>. All the
// colors live in index.css under that attribute — nothing here knows a hex
// value except the browser-chrome theme-color meta.
//
// index.html carries a tiny inline copy of resolve+apply so the right theme
// is set before first paint; keep THEME_STORAGE_KEY and the logic in sync.

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'p26_theme'
export const THEME_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark']

export const DARK_QUERY = '(prefers-color-scheme: dark)'

// The <meta name="theme-color"> value per theme (= --color-bg), for the
// browser/PWA chrome around the app.
export const THEME_COLOR: Record<ResolvedTheme, string> = { dark: '#0a0e1a', light: '#f3f6fb' }

export const isThemePreference = (v: unknown): v is ThemePreference =>
  v === 'system' || v === 'light' || v === 'dark'

export const resolveTheme = (preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme =>
  preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference

// matchMedia is missing in some test/embedded environments — treat that as
// "dark", the app's original and default look.
export const systemPrefersDark = (): boolean =>
  typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    ? true
    : window.matchMedia(DARK_QUERY).matches

export const applyTheme = (theme: ResolvedTheme): void => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}
