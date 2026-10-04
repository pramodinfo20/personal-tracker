// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../hooks/useTheme'
import {
  SCREEN_BACKGROUND_FILES,
  backgroundFileKey,
  resolveBackground,
  resolveBackgroundKey,
  screenBackground,
  screenBackgroundProps,
  type ScreenBackgroundKey,
} from '../../lib/screenBackgrounds'
import { THEME_STORAGE_KEY } from '../../lib/theme'
import { ScreenBackground } from './ScreenBackground'

const SCREENS: ScreenBackgroundKey[] = ['today', 'gate', 'profile', 'generic']

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

  it('with an image: full-bleed cover image, lazy/async, fading in once loaded', () => {
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

  // Alpha of each stop in the overlay's first (vertical) gradient, top to bottom.
  const verticalStops = (bg: string): number[] =>
    [...bg.split('radial-gradient')[0].matchAll(/rgb\(var\(--rgb-bg\) \/ ([\d.]+)\)/g)].map((m) =>
      Number(m[1]),
    )

  it('overlay is strong only behind the header and tab bar, light through the middle', () => {
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

  it('the overlay is drawn in the theme background color (a variable), never a fixed color', () => {
    render(
      <ScreenBackground image="/bg.webp" dim={0.35}>
        <p>content</p>
      </ScreenBackground>,
    )
    const bg = screen.getByTestId('screen-background-overlay').style.background
    expect(bg).toContain('var(--rgb-bg)')
    expect(bg).not.toMatch(/rgb\(\d+[ ,]/)
    expect(bg).not.toMatch(/#[0-9a-f]{3,6}/i)
  })

  it('dim adds a uniform extra veil only when set', () => {
    const dimLayer = 'linear-gradient(rgb(var(--rgb-bg) / 0.35), rgb(var(--rgb-bg) / 0.35))'
    const { rerender } = render(
      <ScreenBackground image="/bg.webp">
        <p>content</p>
      </ScreenBackground>,
    )
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

describe('ScreenBackground — picks the file for the active theme', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  const renderIn = (theme: 'light' | 'dark', key: ScreenBackgroundKey) => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
    const { container } = render(
      <ThemeProvider>
        <ScreenBackground screen={key}>
          <p>content</p>
        </ScreenBackground>
      </ThemeProvider>,
    )
    return container.querySelector('img')!
  }

  it.each(SCREENS)('%s: dark theme shows the dark file, light theme the -light file', (key) => {
    const dark = renderIn('dark', key).getAttribute('src')
    cleanup()
    const light = renderIn('light', key).getAttribute('src')
    expect(dark).toBe(screenBackground(key, 'dark'))
    expect(light).toBe(screenBackground(key, 'light'))
    expect(light).toContain(`${key}-light`)
    expect(dark).not.toContain('-light')
  })

  it("applies the shown image's own dim for that theme", () => {
    renderIn('light', 'today')
    expect(screen.getByTestId('screen-background-overlay').getAttribute('data-dim')).toBe(
      String(screenBackgroundProps('today', 'light').dim),
    )
  })

  it('outside a ThemeProvider it behaves as the dark theme', () => {
    const { container } = render(
      <ScreenBackground screen="gate">
        <p>content</p>
      </ScreenBackground>,
    )
    expect(container.querySelector('img')!.getAttribute('src')).toBe(screenBackground('gate', 'dark'))
  })
})

describe('screen background registry', () => {
  it('has exactly the keyed files (4 screens x 2 themes, plus the summoning circle) — no misnamed, unused-but-bundled images', () => {
    const expected = [...SCREENS.flatMap((k) => [k, `${k}-light`]), 'summon-circle'].sort()
    expect([...SCREEN_BACKGROUND_FILES].sort()).toEqual(expected)
  })

  it('the summoning circle is one dark image used in BOTH themes, veiled in black', () => {
    expect(backgroundFileKey('summon-circle', 'dark')).toBe('summon-circle')
    expect(backgroundFileKey('summon-circle', 'light')).toBe('summon-circle')
    const dark = screenBackgroundProps('summon-circle', 'dark')
    const light = screenBackgroundProps('summon-circle', 'light')
    expect(dark.image).toMatch(/summon-circle[^/]*\.jpg/)
    expect(light.image).toBe(dark.image)
    expect(dark.tone).toBe('dark')
    expect(light.tone).toBe('dark')
    // Themed screens keep the theme's own veil.
    expect(screenBackgroundProps('today', 'light').tone).toBe('theme')
  })

  it('names files <screen>.jpg for dark and <screen>-light.jpg for light', () => {
    expect(backgroundFileKey('today', 'dark')).toBe('today')
    expect(backgroundFileKey('today', 'light')).toBe('today-light')
  })

  it('resolves each screen to its own image in each theme, all eight distinct', () => {
    const urls = SCREENS.flatMap((k) => [screenBackground(k, 'dark'), screenBackground(k, 'light')])
    for (const key of SCREENS) {
      expect(screenBackground(key, 'dark')).toMatch(new RegExp(`${key}[^/]*\\.jpg`))
      expect(screenBackground(key, 'light')).toMatch(new RegExp(`${key}-light[^/]*\\.jpg`))
    }
    expect(new Set(urls).size).toBe(8)
  })

  it("falls back to the SAME theme's generic image, never across themes", () => {
    const registry = { generic: '/g.jpg', 'generic-light': '/gl.jpg', today: '/t.jpg' }
    expect(resolveBackground(registry, 'profile', 'dark')).toBe('/g.jpg')
    expect(resolveBackground(registry, 'profile', 'light')).toBe('/gl.jpg')
    // today has only a dark file: light must NOT borrow it.
    expect(resolveBackground(registry, 'today', 'light')).toBe('/gl.jpg')
    expect(resolveBackgroundKey(registry, 'today', 'light')).toBe('generic-light')
  })

  it('resolves to undefined (-> plain fallback) when the theme has neither', () => {
    expect(resolveBackground({}, 'today', 'dark')).toBeUndefined()
    expect(resolveBackground({ today: '/t.jpg', generic: '/g.jpg' }, 'today', 'light')).toBeUndefined()
  })

  it("carries each image's own dim, per file — so per theme", () => {
    expect(screenBackgroundProps('generic', 'dark')).toEqual({
      image: screenBackground('generic', 'dark'),
      dim: 0.35,
      tone: 'theme',
    })
    expect(screenBackgroundProps('gate', 'dark').dim).toBe(0.45)
    expect(screenBackgroundProps('today', 'dark').dim).toBe(0.35)
    expect(screenBackgroundProps('profile', 'dark').dim).toBe(0)
    // Every light image has a measured dim of its own.
    for (const key of SCREENS) {
      expect(screenBackgroundProps(key, 'light').dim).toBeGreaterThan(0)
      expect(screenBackgroundProps(key, 'light').image).toBe(screenBackground(key, 'light'))
    }
  })
})
