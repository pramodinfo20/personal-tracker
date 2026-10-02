// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  resolveBackground,
  SCREEN_BACKGROUND_FILES,
  screenBackground,
} from '../../lib/screenBackgrounds'
import { ScreenBackground } from './ScreenBackground'

describe('ScreenBackground', () => {
  afterEach(cleanup)

  it('with no image: renders children on the plain fallback — no img, no overlay', () => {
    const { container } = render(
      <ScreenBackground>
        <p>content</p>
      </ScreenBackground>,
    )
    expect(screen.getByText('content')).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByTestId('screen-background-overlay')).toBeNull()
    expect((container.firstElementChild as HTMLElement).className).toContain('bg-bg')
  })

  it('with an image: full-bleed cover image, lazy/async, under the legibility overlay', () => {
    const { container } = render(
      <ScreenBackground image="/bg.webp">
        <p>content</p>
      </ScreenBackground>,
    )
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/bg.webp')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('decoding')).toBe('async')
    expect(img.className).toContain('object-cover')
    // Starts transparent and fades in once loaded — no flash of half-decoded art.
    expect(img.className).toContain('opacity-0')
    fireEvent.load(img)
    expect(img.className).toContain('opacity-100')
    const overlay = screen.getByTestId('screen-background-overlay')
    expect(overlay.style.background).toContain('var(--color-bg)')
  })

  it('shows an image that was already decoded (cached) before onLoad could fire', () => {
    const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete')
    const natural = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth')
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { configurable: true, get: () => true })
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 608 })
    try {
      const { container } = render(
        <ScreenBackground image="/cached.jpg">
          <p>content</p>
        </ScreenBackground>,
      )
      // No load event dispatched — still visible.
      expect(container.querySelector('img')!.className).toContain('opacity-100')
    } finally {
      if (complete) Object.defineProperty(HTMLImageElement.prototype, 'complete', complete)
      if (natural) Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', natural)
    }
  })

  it('falls back cleanly if the image fails to load', () => {
    const { container } = render(
      <ScreenBackground image="/missing.webp">
        <p>content</p>
      </ScreenBackground>,
    )
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByTestId('screen-background-overlay')).toBeNull()
    expect(screen.getByText('content')).toBeTruthy()
  })
})

describe('screen background registry', () => {
  it('has exactly the four keyed files — no misnamed (unused but still bundled) images', () => {
    expect([...SCREEN_BACKGROUND_FILES].sort()).toEqual(['gate', 'generic', 'profile', 'today'])
  })

  it('resolves each screen to its own image', () => {
    for (const key of ['today', 'gate', 'profile', 'generic'] as const) {
      expect(screenBackground(key)).toMatch(new RegExp(`${key}.*\.jpg`))
    }
    expect(new Set(['today', 'gate', 'profile'].map((k) => screenBackground(k as 'today'))).size).toBe(3)
  })

  it('falls back to generic for a screen without its own file', () => {
    expect(resolveBackground({ generic: '/g.jpg' }, 'profile')).toBe('/g.jpg')
  })

  it('resolves to undefined (-> plain fallback) when neither exists', () => {
    expect(resolveBackground({}, 'today')).toBeUndefined()
  })
})

describe('ScreenBackground layouts', () => {
  afterEach(cleanup)

  it("'overlay' is a fixed full-viewport layer; 'page' stays in-flow full-height", () => {
    const { container: overlay } = render(
      <ScreenBackground layout="overlay" image="/p.jpg">
        <p>sheet</p>
      </ScreenBackground>,
    )
    const o = (overlay.firstElementChild as HTMLElement).className
    expect(o).toContain('fixed')
    expect(o).toContain('inset-0')
    expect(o).not.toContain('min-h-dvh')
    cleanup()
    const { container: page } = render(
      <ScreenBackground>
        <p>page</p>
      </ScreenBackground>,
    )
    const pc = (page.firstElementChild as HTMLElement).className
    expect(pc).toContain('relative')
    expect(pc).toContain('min-h-dvh')
  })
})
