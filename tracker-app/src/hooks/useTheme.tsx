// Theme state for the app: the saved preference (same useSaved pattern as
// every other persisted setting), the theme it currently resolves to, and a
// setter. ThemeProvider applies the resolved theme to <html> and follows
// live system changes while the preference is 'system'.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DARK_QUERY,
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  resolveTheme,
  systemPrefersDark,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme'
import { useSaved } from './useSaved'

export interface ThemeContextValue {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

// Outside a provider (isolated component tests) everything reads as the
// original dark theme.
const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  resolved: 'dark',
  setPreference: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useSaved<ThemePreference>(THEME_STORAGE_KEY, 'system')
  // A corrupted/unknown stored value falls back to following the system.
  const preference = isThemePreference(saved) ? saved : 'system'
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(DARK_QUERY)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = resolveTheme(preference, systemDark)

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const value = useMemo(
    () => ({ preference, resolved, setPreference: setSaved }),
    [preference, resolved, setSaved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextValue => useContext(ThemeContext)
