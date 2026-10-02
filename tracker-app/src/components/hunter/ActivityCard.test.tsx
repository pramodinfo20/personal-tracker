// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ActivityCard } from './ActivityCard'

const base = { title: 'Running', glyph: '🏃', gradient: ['#f00', '#00f'] as const }

describe('ActivityCard', () => {
  afterEach(cleanup)

  it('renders the artwork over the gradient (gradient kept), without the emoji watermark', () => {
    const { container } = render(<ActivityCard {...base} image="/running.png" />)
    const card = container.firstElementChild as HTMLElement
    expect(card.style.background).toContain('linear-gradient')
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/running.png')
    expect(img.className).toContain('object-contain')
    expect(container.textContent).not.toContain('🏃')
  })

  it('uses the gradient + emoji treatment when there is no artwork', () => {
    const { container } = render(<ActivityCard {...base} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('🏃')
  })

  it('falls back to the emoji if the artwork fails to load — never a broken image', () => {
    const { container } = render(<ActivityCard {...base} image="/missing.png" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('🏃')
  })
})
