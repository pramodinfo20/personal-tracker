import { useEffect } from 'react'
import type { GateClearedEvent } from '../../hooks/useHunter'

export interface GateClearedOverlayProps {
  event: GateClearedEvent
  onDismiss: () => void
}

export function GateClearedOverlay({ event, onDismiss }: GateClearedOverlayProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-bg/90 px-6 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div className="animate-glow-pulse rounded-3xl border border-accent/60 px-8 py-10 text-center sm:px-16 sm:py-14">
        <div className="text-xs font-bold tracking-[0.3em] text-accent uppercase">
          System Notification
        </div>
        <div className="mt-3 font-mono text-3xl font-black text-text-primary drop-shadow-[0_0_24px_rgba(47,143,255,0.8)] sm:text-4xl">
          GATE CLEARED!
        </div>
        <div className="mt-3 text-xl font-bold text-accent">{event.name}</div>
        <div className="mt-3 text-lg font-bold text-warning">+{event.xp} Bonus XP</div>
        <div className="mt-4 text-xs text-text-muted">tap anywhere to dismiss</div>
      </div>
    </div>
  )
}
