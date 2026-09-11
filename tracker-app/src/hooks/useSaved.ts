// Typed port of useSaved from pramod-2026-tracker.html — same localStorage
// read-on-init / write-on-change behavior, just generic over the value type.

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function useSaved<T>(
  key: string,
  def: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : def
    } catch {
      return def
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore write failures (e.g. storage quota, private browsing)
    }
  }, [key, value])

  return [value, setValue]
}
