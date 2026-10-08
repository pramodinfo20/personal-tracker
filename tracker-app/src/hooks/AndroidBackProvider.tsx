import { useEffect, useMemo, type ReactNode } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { createAndroidBackStack } from '../lib/androidBack'
import { AndroidBackContext } from './androidBackContext'

export function AndroidBackProvider({ children }: { children: ReactNode }) {
  const stack = useMemo(() => createAndroidBackStack(), [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let active = true
    let remove: (() => void) | undefined

    CapacitorApp.addListener('backButton', () => {
      if (!stack.handleBack()) void CapacitorApp.exitApp()
    }).then((handle) => {
      if (!active) void handle.remove()
      else remove = () => void handle.remove()
    })

    return () => {
      active = false
      remove?.()
    }
  }, [stack])

  return <AndroidBackContext.Provider value={stack}>{children}</AndroidBackContext.Provider>
}
