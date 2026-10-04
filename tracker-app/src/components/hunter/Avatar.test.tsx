// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

describe('Avatar', () => {
  afterEach(cleanup)

  it('shows the photo when one is set', () => {
    const { container } = render(<Avatar name="Pramod" photo={PHOTO} />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(PHOTO)
    expect(container.textContent).toBe('')
  })

  it('falls back to the first letter when there is no photo', () => {
    const { container } = render(<Avatar name="pramod" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('P')
  })

  it('falls back to the letter rather than rendering a value that is not a photo', () => {
    const { container } = render(<Avatar name="Pramod" photo="https://example.com/x.jpg" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('P')
  })
})
