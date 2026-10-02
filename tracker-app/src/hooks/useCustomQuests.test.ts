// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useCustomQuests, type NewCustomQuest } from './useCustomQuests'

const NEW_QUEST: NewCustomQuest = {
  name: 'Drink water',
  category: 'hydration',
  iconKey: 'droplet',
  statKey: 'VIT',
  tiers: [
    { label: '0.5L', xp: 8 },
    { label: '1L', xp: 15 },
  ],
}

describe('useCustomQuests', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useCustomQuests())
    expect(result.current.customQuests).toEqual([])
  })

  it('addQuest creates an active quest with a generated id', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest(NEW_QUEST)
    })
    expect(result.current.customQuests).toHaveLength(1)
    const created = result.current.customQuests[0]
    expect(created.id).toBeTruthy()
    expect(created.active).toBe(true)
    expect(created.name).toBe('Drink water')
    expect(created.tiers).toEqual(NEW_QUEST.tiers)
  })

  it('assigns distinct ids to quests added back-to-back', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest(NEW_QUEST)
      result.current.addQuest({ ...NEW_QUEST, name: 'Second quest' })
    })
    const [a, b] = result.current.customQuests
    expect(a.id).not.toBe(b.id)
  })

  it('updateQuest patches only the target quest', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest(NEW_QUEST)
      result.current.addQuest({ ...NEW_QUEST, name: 'Other quest' })
    })
    const [first, second] = result.current.customQuests
    act(() => {
      result.current.updateQuest(first.id, { name: 'Renamed' })
    })
    expect(result.current.customQuests.find((q) => q.id === first.id)?.name).toBe('Renamed')
    expect(result.current.customQuests.find((q) => q.id === second.id)?.name).toBe('Other quest')
  })

  it('setQuestActive toggles a quest without touching others', () => {
    const { result } = renderHook(() => useCustomQuests())
    act(() => {
      result.current.addQuest(NEW_QUEST)
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
      result.current.addQuest(NEW_QUEST)
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
      result.current.addQuest(NEW_QUEST)
    })
    unmount()
    const { result: result2 } = renderHook(() => useCustomQuests())
    expect(result2.current.customQuests).toHaveLength(1)
    expect(result2.current.customQuests[0].name).toBe('Drink water')
  })
})
