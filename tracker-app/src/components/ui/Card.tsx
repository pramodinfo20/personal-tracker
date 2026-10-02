import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  /** Lifts on hover — use for cards that navigate or expand. */
  interactive?: boolean
  /** Persistent accent border + glow — use to mark an active/highlighted panel. */
  glow?: boolean
  children: ReactNode
}

export function Card({
  title,
  icon,
  action,
  interactive,
  glow,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        // Shared HUD glass (index.css) — see-through, so screen art shows.
        'hud-glass rounded-2xl p-5',
        interactive && 'hud-pressable cursor-pointer',
        glow && 'hud-glass-strong glow-accent',
        className,
      )}
      {...rest}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-lg leading-none">{icon}</span>}
            {title && (
              <h3 className="font-sans text-sm font-bold tracking-wide text-text-primary uppercase">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
