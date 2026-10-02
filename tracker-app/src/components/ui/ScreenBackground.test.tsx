// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  resolveBackground,
  SCREEN_BACKGROUND_FILES,
  screenBackground,
  screenBackgroundProps,
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
  })

  // Alpha of each stop in the overlay's first (vertical) gradient, top to
  // bottom. (jsdom normalizes `rgb(10 14 26 / a)` to `rgba(10, 14, 26, a)`.)
  const verticalStops = (bg: string): number[] =>
    [...bg.split('radial-gradient')[0].matchAll(/rgba\(10, 14, 26, ([\d.]+)\)/g)].map((m) =>
      Number(m[1]),
    )

  it('overlay is dark only behind the header and tab bar, light through the middle', () => {
    render(
      <ScreenBackground image="/bg.webp">
        <p>content</p>
      </ScreenBackground>,
    )
    const stops = verticalStops(screen.getByTestId('screen-background-overlay').style.background)
    expect(stops).toHaveLength(5)
    const [top, , middle, , bottom] = stops
    expect(top).toBeGreaterThanOrEqual(0.8)
    expect(bottom).toBeGreaterThanOrEqual(0.8)
    // The art must read through the card area: no stop between the ends is heavy.
    expect(Math.max(...stops.slice(1, -1))).toBeLessThanOrEqual(0.4)
    expect(middle).toBeLessThanOrEqual(0.25)
  })

  it('dim adds a uniform extra darkening layer only when set', () => {
    const { rerender } = render(
      <ScreenBackground image="/bg.webp">
        <p>content</p>
      </ScreenBackground>,
    )
    const dimLayer = 'linear-gradient(rgba(10, 14, 26, 0.35), rgba(10, 14, 26, 0.35))'
    expect(screen.getByTestId('screen-background-overlay').style.background).not.toContain(dimLayer)
    rerender(
      <ScreenBackground image="/bg.webp" dim={0.35}>
        <p>content</p>
      </ScreenBackground>,
    )
    expect(screen.getByTestId('screen-background-overlay').style.background).toContain(dimLayer)
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

  it("carries each image's own dim: the two bright images are calmed wherever they're used", () => {
    expect(screenBackgroundProps('generic')).toEqual({ image: screenBackground('generic'), dim: 0.35 })
    expect(screenBackgroundProps('gate').dim).toBe(0.35)
    expect(screenBackgroundProps('today').dim).toBe(0)
    expect(screenBackgroundProps('profile').dim).toBe(0)
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
