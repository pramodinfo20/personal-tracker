// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnboardingFlow } from './OnboardingFlow'

const button = (name: RegExp | string) => screen.getByRole('button', { name })
const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const toStep2 = (name = 'Jin') => {
  type('Your name', name)
  fireEvent.click(button('Continue'))
}

describe('OnboardingFlow — first launch', () => {
  afterEach(cleanup)

  it('step 1: the name is required to continue', () => {
    render(<OnboardingFlow onComplete={vi.fn()} />)
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy()
    expect((button('Continue') as HTMLButtonElement).disabled).toBe(true)
    type('Your name', '   ')
    expect((button('Continue') as HTMLButtonElement).disabled).toBe(true)
    type('Your name', 'Jin')
    fireEvent.click(button('Continue'))
    expect(screen.getByText(/Step 2 of 3/)).toBeTruthy()
  })

  it('first launch cannot be cancelled', () => {
    render(<OnboardingFlow onComplete={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('step 2 is optional: Skip moves on and discards anything typed there', () => {
    const onComplete = vi.fn()
    render(<OnboardingFlow onComplete={onComplete} />)
    toStep2()
    type(/Age/, '28')
    fireEvent.click(button('Skip'))
    expect(screen.getByText(/Step 3 of 3/)).toBeTruthy()
    fireEvent.click(button(/Physical \/ Fitness/))
    fireEvent.click(button('Start Hunting'))
    expect(onComplete).toHaveBeenCalledWith({
      name: 'Jin',
      age: undefined,
      heightCm: undefined,
      weightKg: undefined,
      goals: ['exercise'],
    })
  })

  it('step 2 blocks Continue on an out-of-range value and says what is allowed', () => {
    render(<OnboardingFlow onComplete={vi.fn()} />)
    toStep2()
    type(/Height/, '9999')
    expect((button('Continue') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('alert').textContent).toContain('Height: 50–260 cm')
    type(/Height/, '178')
    expect((button('Continue') as HTMLButtonElement).disabled).toBe(false)
  })

  it('step 3: at least one goal is required; goals are multi-select toggles', () => {
    const onComplete = vi.fn()
    render(<OnboardingFlow onComplete={onComplete} />)
    toStep2('  Jin  ')
    type(/Age/, '28')
    type(/Height/, '178')
    type(/Weight/, '74.5')
    fireEvent.click(button('Continue'))

    const finish = button('Pick at least one') as HTMLButtonElement
    expect(finish.disabled).toBe(true)

    const fitness = button(/Physical \/ Fitness/)
    fireEvent.click(fitness)
    expect(fitness.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(button(/Career \/ Networking/))
    fireEvent.click(button(/Hydration/))
    // toggling off again
    fireEvent.click(button(/Career \/ Networking/))
    expect(button(/Career \/ Networking/).getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(button('Start Hunting'))
    expect(onComplete).toHaveBeenCalledWith({
      name: 'Jin',
      age: 28,
      heightCm: 178,
      weightKg: 74.5,
      goals: ['exercise', 'hydration'],
    })
  })

  it('offers every activity-library category as a goal', () => {
    render(<OnboardingFlow onComplete={vi.fn()} />)
    toStep2()
    fireEvent.click(button('Skip'))
    expect(screen.getByRole('group', { name: 'Goals' }).querySelectorAll('button')).toHaveLength(6)
  })

  it('Back keeps what was entered', () => {
    render(<OnboardingFlow onComplete={vi.fn()} />)
    toStep2('Jin')
    fireEvent.click(button(/Back/))
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Jin')
  })
})

describe('OnboardingFlow — retake from Profile', () => {
  afterEach(cleanup)

  it('prefills, can be cancelled, and warns that it resets built-in quest visibility', () => {
    const onCancel = vi.fn()
    const onComplete = vi.fn()
    render(
      <OnboardingFlow
        initial={{ name: 'Pramod', age: 30, goals: ['learning', 'career'] }}
        onComplete={onComplete}
        onCancel={onCancel}
      />,
    )
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Pramod')
    fireEvent.click(button('Cancel'))
    expect(onCancel).toHaveBeenCalled()

    fireEvent.click(button('Continue'))
    expect((screen.getByLabelText(/Age/) as HTMLInputElement).value).toBe('30')
    fireEvent.click(button('Continue'))
    expect(button(/Skills \/ Learning/).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(/resets which built-in quests show on Today/)).toBeTruthy()
    fireEvent.click(button('Save setup'))
    expect(onComplete).toHaveBeenCalledWith({
      name: 'Pramod',
      age: 30,
      heightCm: undefined,
      weightKg: undefined,
      goals: ['learning', 'career'],
    })
  })
})
