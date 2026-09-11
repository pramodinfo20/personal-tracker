// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClaimCelebration } from './useClaimCelebration'

describe('useClaimCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with nothing celebrating', () => {
    const { result } = renderHook(() => useClaimCelebration())
    expect(result.current.celebrating).toEqual({})
  })

  it('records the xp amount for a key when celebrated', () => {
    const { result } = renderHook(() => useClaimCelebration())
    act(() => {
      result.current.celebrate('q_train', 25)
    })
    expect(result.current.celebrating).toEqual({ q_train: 25 })
  })

  it('clears the key automatically after the celebration window', () => {
    const { result } = renderHook(() => useClaimCelebration())
    act(() => {
      result.current.celebrate('q_train', 25)
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.celebrating).toEqual({})
  })

  it('calls onDone once the celebration clears', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useClaimCelebration())
    act(() => {
      result.current.celebrate('light', 10, onDone)
    })
    expect(onDone).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('tracks multiple keys independently', () => {
    const { result } = renderHook(() => useClaimCelebration())
    act(() => {
      result.current.celebrate('a', 10)
      result.current.celebrate('b', 20)
    })
    expect(result.current.celebrating).toEqual({ a: 10, b: 20 })
  })

  it('re-triggering the same key resets its own timer instead of stacking', () => {
    const { result } = renderHook(() => useClaimCelebration())
    act(() => {
      result.current.celebrate('a', 10)
    })
    act(() => {
      vi.advanceTimersByTime(700)
    })
    act(() => {
      result.current.celebrate('a', 15)
    })
    act(() => {
      vi.advanceTimersByTime(700)
    })
    // First timer would've fired by now (700+700=1400 > 900) if not reset
    expect(result.current.celebrating).toEqual({ a: 15 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.celebrating).toEqual({})
  })
})
