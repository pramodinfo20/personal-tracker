// Tracks a short-lived "just claimed this for +N XP" state per key, so a
// card/button can show a floating "+XP" and a brief pulse right where the
// tap happened, then clean itself up. Used by DailyQuestCards (key = quest
// id) and LogActivityForm (key = log tier), so the animation timing lives
// in one place instead of being duplicated.

import { useCallback, useRef, useState } from 'react'

const CELEBRATION_MS = 900

export function useClaimCelebration<K extends string = string>() {
  const [celebrating, setCelebrating] = useState<Partial<Record<K, number>>>({})
  const timers = useRef<Partial<Record<K, ReturnType<typeof setTimeout>>>>({})

  const celebrate = useCallback((key: K, xp: number, onDone?: () => void) => {
    setCelebrating((c) => ({ ...c, [key]: xp }))
    const existing = timers.current[key]
    if (existing) clearTimeout(existing)
    timers.current[key] = setTimeout(() => {
      setCelebrating((c) => {
        const next = { ...c }
        delete next[key]
        return next
      })
      onDone?.()
    }, CELEBRATION_MS)
  }, [])

  return { celebrating, celebrate }
}
