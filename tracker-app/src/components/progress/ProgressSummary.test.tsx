// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ProgressSummary } from './ProgressSummary'

const tile = (label: string) => screen.getByText(label).previousSibling?.textContent

describe('ProgressSummary — Streak tile', () => {
  afterEach(cleanup)

  it('shows the streak as a number', () => {
    render(<ProgressSummary totalXP={315} daysActive={7} range="week" streak={12} />)
    expect(tile('Streak')).toBe('🔥 12')
  })

  it('shows a real 0 — never a placeholder dash — when there is no streak', () => {
    render(<ProgressSummary totalXP={0} daysActive={0} range="week" streak={0} />)
    expect(tile('Streak')).toBe('0')
    expect(document.body.textContent).not.toContain('—')
  })

  it('shows 1 on the first day', () => {
    render(<ProgressSummary totalXP={15} daysActive={1} range="week" streak={1} />)
    expect(tile('Streak')).toBe('🔥 1')
  })
})
