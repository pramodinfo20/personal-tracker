import { describe, expect, it, vi } from 'vitest'
import { createAndroidBackStack } from './androidBack'

describe('android back action stack', () => {
  it('runs the highest-priority action first', () => {
    const stack = createAndroidBackStack()
    const root = vi.fn()
    const sheet = vi.fn()
    stack.register({ priority: 10, run: root })
    stack.register({ priority: 100, run: sheet })

    expect(stack.handleBack()).toBe(true)
    expect(sheet).toHaveBeenCalledTimes(1)
    expect(root).not.toHaveBeenCalled()
  })

  it('uses the newest action when priorities match', () => {
    const stack = createAndroidBackStack()
    const first = vi.fn()
    const second = vi.fn()
    stack.register({ priority: 100, run: first })
    stack.register({ priority: 100, run: second })

    stack.handleBack()

    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it('continues when an action returns false and cleans up registrations', () => {
    const stack = createAndroidBackStack()
    const fallback = vi.fn()
    const remove = stack.register({ priority: 100, run: () => false })
    stack.register({ priority: 10, run: fallback })

    expect(stack.handleBack()).toBe(true)
    expect(fallback).toHaveBeenCalledTimes(1)

    remove()
    expect(stack.size()).toBe(1)
  })
})
