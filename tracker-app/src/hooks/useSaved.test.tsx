// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSaved } from './useSaved'

describe('useSaved', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('reads the default when nothing is stored yet', () => {
    const { result } = renderHook(() => useSaved('unset-key', { count: 0 }))
    expect(result.current[0]).toEqual({ count: 0 })
  })

  it('reads an existing value from localStorage on init', () => {
    localStorage.setItem('existing-key', JSON.stringify({ count: 7 }))
    const { result } = renderHook(() => useSaved('existing-key', { count: 0 }))
    expect(result.current[0]).toEqual({ count: 7 })
  })

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useSaved('write-key', { count: 0 }))
    act(() => {
      result.current[1]({ count: 5 })
    })
    expect(result.current[0]).toEqual({ count: 5 })
    expect(JSON.parse(localStorage.getItem('write-key')!)).toEqual({ count: 5 })
  })

  it('falls back to the default when stored JSON is corrupt', () => {
    localStorage.setItem('corrupt-key', '{not json')
    const { result } = renderHook(() => useSaved('corrupt-key', { count: 0 }))
    expect(result.current[0]).toEqual({ count: 0 })
  })
})
