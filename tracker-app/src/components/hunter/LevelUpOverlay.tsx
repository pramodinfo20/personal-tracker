import { useEffect } from 'react'
import { useAndroidBackAction } from '../../hooks/useAndroidBackAction'
import type { LevelUpEvent } from '../../hooks/useHunter'
import { cn } from '../../lib/cn'
import { LEVEL_UP_COPY } from '../../lib/copy'
import { TIER_CLASSES } from '../ui'
import { rankTierColor } from './tierMapping'

export interface LevelUpOverlayProps {
  event: LevelUpEvent
  onDismiss: () => void
}

export function LevelUpOverlay({ event, onDismiss }: LevelUpOverlayProps) {
  useAndroidBackAction(true, onDismiss, 300)

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
        <div className="mt-3 font-mono text-4xl font-black text-text-primary drop-shadow-[0_0_24px_rgb(var(--rgb-accent)/0.8)] sm:text-5xl">
          LEVEL UP!
        </div>
        <div className="mt-3 font-mono text-xl font-bold text-accent sm:text-2xl">
          You have reached Level {event.level}
        </div>
        {event.rankUp && (
          <div
            className={cn(
              'mt-3 text-base font-bold',
              TIER_CLASSES[rankTierColor(event.rank.name)].text,
            )}
          >
            🎉 Rank Up: {event.rank.emoji} {event.rank.name}
          </div>
        )}
        <div className="mt-3 text-sm text-text-secondary">
          +{event.gained * 3} stat points earned
        </div>
        <div className="mt-3 text-xs text-text-secondary sm:text-sm">{LEVEL_UP_COPY.encouragement}</div>
        <div className="mt-4 text-xs text-text-muted">tap anywhere to dismiss</div>
      </div>
    </div>
  )
}
