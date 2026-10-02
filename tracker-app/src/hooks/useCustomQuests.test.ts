// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { findActivity } from '../lib/activities'
import type { CustomQuest } from '../lib/customQuests'
import { useCustomQuests } from './useCustomQuests'

const KEY = 'p26_custom_quests'

describe('useCustomQuests', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useCustomQuests())
    expect(result.current.customQuests).toEqual([])
  })

  it('addQuest builds an active quest entirely from the library activity', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('running')
    })
    const running = findActivity('running')!
    expect(result.current.customQuests).toHaveLength(1)
    const created = result.current.customQuests[0]
    expect(created.id).toBeTruthy()
    expect(created).toMatchObject({
      name: 'Running',
      category: 'exercise',
      iconKey: 'run',
      statKey: 'STR',
      active: true,
      activityId: 'running',
      tiers: running.tiers,
    })
  })

  it("copies the tiers, so the saved quest can't alias the library's array", () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('water')
    })
    expect(result.current.customQuests[0].tiers).not.toBe(findActivity('water')!.tiers)
  })

  it('ignores an id that is not in the library', () => {
    const { result } = renderHook(() => useCustomQuests())
    let created: CustomQuest | null = null
    act(() => {
      created = result.current.addQuest('made_up_activity')
    })
    expect(created).toBeNull()
    expect(result.current.customQuests).toEqual([])
  })

  it('assigns distinct ids to quests added back-to-back (even the same activity)', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('water')
      result.current.addQuest('water')
    })
    const [a, b] = result.current.customQuests
    expect(a.id).not.toBe(b.id)
  })

  it('renameQuest changes only the target quest’s name — never its tiers', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('reading')
      result.current.addQuest('coding')
    })
    const [first, second] = result.current.customQuests
    act(() => {
      result.current.renameQuest(first.id, '  Novel time ')
    })
    const renamed = result.current.customQuests.find((q) => q.id === first.id)!
    expect(renamed.name).toBe('Novel time')
    expect(renamed.tiers).toEqual(first.tiers)
    expect(result.current.customQuests.find((q) => q.id === second.id)?.name).toBe('Coding Practice')
  })

  it('renameQuest refuses a blank name', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('reading')
    })
    const id = result.current.customQuests[0].id
    act(() => {
      result.current.renameQuest(id, '   ')
    })
    expect(result.current.customQuests[0].name).toBe('Reading')
  })

  it('setQuestActive toggles a quest without touching others', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('water')
    })
    const id = result.current.customQuests[0].id
    act(() => {
      result.current.setQuestActive(id, false)
    })
    expect(result.current.customQuests[0].active).toBe(false)
    act(() => {
      result.current.setQuestActive(id, true)
    })
    expect(result.current.customQuests[0].active).toBe(true)
  })

  it('deleteQuest removes the quest entirely', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('water')
    })
    const id = result.current.customQuests[0].id
    act(() => {
      result.current.deleteQuest(id)
    })
    expect(result.current.customQuests).toEqual([])
  })

  it('persists across remounts via localStorage', () => {
    const { result, unmount } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest('water')
    })
    unmount()
    const { result: result2 } = renderHook(() => useCustomQuests())
    expect(result2.current.customQuests).toHaveLength(1)
    expect(result2.current.customQuests[0].name).toBe('Drinking Water')
  })

  it('loads a pre-library quest (user-edited tiers, no activityId) untouched', () => {
    const legacy: CustomQuest = {
      id: 'cq_old',
      name: 'Morning Stretch',
      category: 'custom',
      iconKey: 'star',
      statKey: 'AGI',
      tiers: [
        { label: 'Quick', xp: 7 },
        { label: 'Full', xp: 18 },
      ],
      active: true,
    }
    localStorage.setItem(KEY, JSON.stringify([legacy]))
    const { result } = renderHook(() => useCustomQuests())
    expect(result.current.customQuests).toEqual([legacy])
  })
})
