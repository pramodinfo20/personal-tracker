// @vitest-environment jsdom
// The intro splash by itself, and where the app shows it: once, before
// setup, on a genuinely fresh install — never for an existing save.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { INTRO_COPY } from '../../lib/copy'
import { DEFAULT_HUNTER } from '../../lib/hunterState'
import { INTRO_MS, INTRO_SEEN_KEY, markIntroSeen, shouldShowIntro } from '../../lib/intro'
import { IntroSplash } from './IntroSplash'

const intro = () => screen.queryByRole('button', { name: 'Skip intro' })
const setup = () => screen.queryByRole('dialog', { name: 'Welcome setup' })

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  localStorage.clear()
})

describe('IntroSplash', () => {
  it('shows the catchphrase, one line', () => {
    render(<IntroSplash onDone={vi.fn()} />)
    expect(INTRO_COPY.headline).toBe('Your journey begins now.')
    expect(screen.getByText(INTRO_COPY.headline)).toBeTruthy()
    expect(INTRO_COPY.headline).not.toMatch(/\n/)
  })

  it('moves on by itself after a couple of seconds — and not before', () => {
    const onDone = vi.fn()
    render(<IntroSplash onDone={onDone} />)
    expect(INTRO_MS).toBeGreaterThanOrEqual(1500)
    expect(INTRO_MS).toBeLessThanOrEqual(3500)
    act(() => void vi.advanceTimersByTime(INTRO_MS - 100))
    expect(onDone).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(200))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('a tap skips it immediately', () => {
    const onDone = vi.fn()
    render(<IntroSplash onDone={onDone} />)
    fireEvent.click(intro()!)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('any key skips it too', () => {
    const onDone = vi.fn()
    render(<IntroSplash onDone={onDone} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('finishes only once, however it is triggered', () => {
    const onDone = vi.fn()
    render(<IntroSplash onDone={onDone} />)
    fireEvent.click(intro()!)
    fireEvent.click(intro()!)
    fireEvent.keyDown(window, { key: ' ' })
    act(() => void vi.advanceTimersByTime(INTRO_MS * 2))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('leaves no timer running after it is removed', () => {
    const onDone = vi.fn()
    const { unmount } = render(<IntroSplash onDone={onDone} />)
    unmount()
    act(() => void vi.advanceTimersByTime(INTRO_MS * 2))
    expect(onDone).not.toHaveBeenCalled()
  })
})

describe('shouldShowIntro', () => {
  it('only for a save with no name that has not seen it', () => {
    expect(shouldShowIntro('', localStorage)).toBe(true)
    expect(shouldShowIntro('   ', localStorage)).toBe(true)
    expect(shouldShowIntro('Pramod', localStorage)).toBe(false)
    markIntroSeen(localStorage)
    expect(shouldShowIntro('', localStorage)).toBe(false)
  })

  it('its marker is device-local, not part of the backed-up save', () => {
    expect(INTRO_SEEN_KEY.startsWith('p26_')).toBe(false)
  })
})

describe('App — intro splash on first launch', () => {
  it('a fresh install sees the intro first, then setup step 1 when it auto-advances', () => {
    render(<App />)
    expect(intro()).toBeTruthy()
    expect(setup()).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()

    act(() => void vi.advanceTimersByTime(INTRO_MS + 50))
    expect(intro()).toBeNull()
    expect(setup()).toBeTruthy()
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy()
    expect(screen.getByLabelText('Your name')).toBeTruthy()
  })

  it('tapping goes straight to setup without waiting', () => {
    render(<App />)
    fireEvent.click(intro()!)
    expect(intro()).toBeNull()
    expect(setup()).toBeTruthy()
  })

  it('is shown once: reloading mid-setup goes straight back to setup', () => {
    const first = render(<App />)
    fireEvent.click(intro()!)
    expect(localStorage.getItem(INTRO_SEEN_KEY)).not.toBeNull()
    first.unmount()

    render(<App />) // "reload" before setup was finished
    expect(intro()).toBeNull()
    expect(setup()).toBeTruthy()
  })

  it('an existing save never sees it', () => {
    localStorage.setItem('p26_hunter', JSON.stringify({ ...DEFAULT_HUNTER, name: 'Pramod', level: 11 }))
    render(<App />)
    expect(intro()).toBeNull()
    expect(setup()).toBeNull()
    expect(screen.getByRole('navigation')).toBeTruthy()
    act(() => void vi.advanceTimersByTime(INTRO_MS * 2))
    expect(intro()).toBeNull()
    // ...and it isn't marked as seen either: nothing about the save changes.
    expect(localStorage.getItem(INTRO_SEEN_KEY)).toBeNull()
  })

  it('does not come back after setup is completed', () => {
    const first = render(<App />)
    fireEvent.click(intro()!)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Jin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    fireEvent.click(screen.getByRole('button', { name: /Physical \/ Fitness/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start Hunting' }))
    expect(screen.getByRole('navigation')).toBeTruthy()
    first.unmount()

    render(<App />)
    expect(intro()).toBeNull()
    expect(setup()).toBeNull()
  })
})
