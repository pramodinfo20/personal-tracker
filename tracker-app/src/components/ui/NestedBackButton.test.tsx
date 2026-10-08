// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NestedBackButton } from './NestedBackButton'

describe('NestedBackButton', () => {
  afterEach(cleanup)

  it('is a clear accessible back control for More sub-screens', () => {
    const onClick = vi.fn()
    render(<NestedBackButton onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Back to More' })
    expect(button.textContent).toContain('More')

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
