// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { screenBackground } from '../../lib/screenBackgrounds'
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

describe('screenBackground', () => {
  it('returns undefined while no background files exist yet (-> fallback)', () => {
    expect(screenBackground('today')).toBeUndefined()
    expect(screenBackground('profile')).toBeUndefined()
  })
})
