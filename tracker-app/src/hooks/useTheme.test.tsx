// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { DARK_QUERY, THEME_STORAGE_KEY } from '../lib/theme'
import { ThemeProvider, useTheme } from './useTheme'

// A controllable prefers-color-scheme: tests set `matches` and fire `change`.
const mockSystem = (dark: boolean) => {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  const mql = {
    matches: dark,
    media: DARK_QUERY,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia
  return {
    change: (nowDark: boolean) => {
      mql.matches = nowDark
      listeners.forEach((cb) => cb({ matches: nowDark } as MediaQueryListEvent))
    },
    listenerCount: () => listeners.size,
  }
}

function Readout() {
  const { preference, resolved } = useTheme()
  return <output>{`${preference}/${resolved}`}</output>
}

const mount = () =>
  render(
    <ThemeProvider>
      <Readout />
      <ThemeToggle />
    </ThemeProvider>,
  )

const applied = () => document.documentElement.dataset.theme
const saved = () => JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)
const pick = (name: RegExp) => fireEvent.click(screen.getByRole('radio', { name }))

describe('ThemeProvider + ThemeToggle', () => {
  const originalMatchMedia = window.matchMedia
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })
  afterEach(() => {
    cleanup()
    window.matchMedia = originalMatchMedia
  })

  it('first load with no saved choice follows the system: light device -> light', () => {
    mockSystem(false)
    mount()
    expect(screen.getByRole('status').textContent).toBe('system/light')
    expect(applied()).toBe('light')
  })

  it('first load with no saved choice follows the system: dark device -> dark', () => {
    mockSystem(true)
    mount()
    expect(screen.getByRole('status').textContent).toBe('system/dark')
    expect(applied()).toBe('dark')
  })

  it("while on 'system', a live device change switches the theme", () => {
    const system = mockSystem(true)
    mount()
    expect(applied()).toBe('dark')
    act(() => system.change(false))
    expect(applied()).toBe('light')
    expect(screen.getByText(/currently light/)).toBeTruthy()
  })

  it('a manual choice overrides the system, applies immediately, and is saved', () => {
    const system = mockSystem(true)
    mount()
    pick(/Light/)
    expect(applied()).toBe('light')
    expect(saved()).toBe('light')
    expect(screen.getByRole('radio', { name: /Light/ }).getAttribute('aria-checked')).toBe('true')
    // The device flipping no longer matters once a choice is made.
    act(() => system.change(false))
    act(() => system.change(true))
    expect(applied()).toBe('light')

    pick(/Dark/)
    expect(applied()).toBe('dark')
    expect(saved()).toBe('dark')
  })

  it('the saved choice survives a reload (remount)', () => {
    mockSystem(true)
    const first = mount()
    pick(/Light/)
    first.unmount()
    delete document.documentElement.dataset.theme
    mount()
    expect(screen.getByRole('status').textContent).toBe('light/light')
    expect(applied()).toBe('light')
  })

  it("choosing System again goes back to following the device", () => {
    mockSystem(false)
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('dark'))
    mount()
    expect(applied()).toBe('dark')
    pick(/System/)
    expect(applied()).toBe('light')
    expect(saved()).toBe('system')
  })

  it('a corrupted saved value falls back to following the system', () => {
    mockSystem(false)
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('sepia'))
    mount()
    expect(screen.getByRole('status').textContent).toBe('system/light')
  })

  it('stops listening to the system when unmounted', () => {
    const system = mockSystem(true)
    const { unmount } = mount()
    expect(system.listenerCount()).toBe(1)
    unmount()
    expect(system.listenerCount()).toBe(0)
  })
})
