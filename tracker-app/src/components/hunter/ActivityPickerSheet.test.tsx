// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTIVITY_CATEGORIES, findActivity } from '../../lib/activities'
import { DAILY_LOG_CAP } from '../../lib/quests'
import { ActivityPickerSheet } from './ActivityPickerSheet'

// No input anywhere in the flow may accept a number — XP only ever comes
// from the library's fixed tiers. The only text input is log mode's note.
const expectNoXPInput = () => {
  expect(document.body.querySelectorAll('input[type="number"]')).toHaveLength(0)
  for (const input of document.body.querySelectorAll('input')) {
    expect(input.getAttribute('placeholder') ?? '').toMatch(/^Note/)
  }
}

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }))

describe('ActivityPickerSheet', () => {
  afterEach(cleanup)

  it('step 1 shows every category as a card', () => {
    render(<ActivityPickerSheet mode="recurring" onAddQuest={vi.fn()} onClose={vi.fn()} />)
    for (const c of ACTIVITY_CATEGORIES) {
      expect(screen.getByRole('button', { name: new RegExp(c.label.replace('/', '\\/')) })).toBeTruthy()
    }
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy()
  })

  it('keeps picker content in an internal safe-area-aware scroll region', () => {
    render(<ActivityPickerSheet mode="recurring" onAddQuest={vi.fn()} onClose={vi.fn()} />)

    const scrollRegion = screen.getByTestId('activity-picker-scroll')
    expect(scrollRegion.className).toContain('overflow-y-auto')
    expect(scrollRegion.className).toContain('env(safe-area-inset-bottom)')
  })

  it('log mode: category -> activity -> tapping a tier claims that exact tier', () => {
    const onLog = vi.fn()
    render(<ActivityPickerSheet mode="log" logCount={0} onLog={onLog} onClose={vi.fn()} />)
    expectNoXPInput()
    click(/^Exercise/)
    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy()
    expectNoXPInput()
    click(/^Running/)
    expect(screen.getByText(/Step 3 of 3/)).toBeTruthy()
    expectNoXPInput()

    fireEvent.change(screen.getByPlaceholderText(/^Note/), { target: { value: 'Riverside' } })
    click(/^10K/)

    expect(onLog).toHaveBeenCalledWith('running', findActivity('running')!.tiers[2], 'Riverside')
  })

  it('recurring mode: step 3 lists the fixed tiers read-only and saves by activity id', () => {
    const onAddQuest = vi.fn()
    const onClose = vi.fn()
    const { container } = render(
      <ActivityPickerSheet mode="recurring" onAddQuest={onAddQuest} onClose={onClose} />,
    )
    click(/^Hydration/)
    click(/^Drinking Water/)
    expect(container.querySelectorAll('input')).toHaveLength(0)
    for (const t of findActivity('water')!.tiers) expect(screen.getByText(`+${t.xp} XP`)).toBeTruthy()

    click('Add to My Quests')
    expect(onAddQuest).toHaveBeenCalledWith('water')
    expect(onClose).toHaveBeenCalled()
  })

  it('Back walks from step 3 to step 1', () => {
    render(<ActivityPickerSheet mode="recurring" onAddQuest={vi.fn()} onClose={vi.fn()} />)
    click(/^Career/)
    click(/^Networking/)
    click('Back')
    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy()
    click('Back')
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy()
  })

  it('log mode at the daily cap shows the cap message instead of the picker', () => {
    render(
      <ActivityPickerSheet mode="log" logCount={DAILY_LOG_CAP} onLog={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText(/logged your 3 activities/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Exercise/ })).toBeNull()
  })
})
