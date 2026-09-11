import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { TIER_CLASSES, type Tier } from './tiers'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tier: Tier
  children: ReactNode
}

export function Badge({ tier, className, children, ...rest }: BadgeProps) {
  const t = TIER_CLASSES[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-xs font-bold tracking-wide uppercase transition-shadow duration-150',
        t.bg,
        t.border,
        t.text,
        t.glow,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
