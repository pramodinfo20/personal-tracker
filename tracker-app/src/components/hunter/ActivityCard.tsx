import type { ReactNode } from 'react'
import { gradientCss, type Gradient } from '../../lib/activities'
import { cn } from '../../lib/cn'

export interface ActivityCardProps {
  title: string
  subtitle?: string
  glyph: string
  gradient: Gradient
  onClick?: () => void
  /** 'tile' for the step 1/2 grids; 'banner' for the selected activity atop step 3. */
  size?: 'tile' | 'banner'
  children?: ReactNode
}

// The library's "background image" treatment, built entirely in CSS: a
// per-activity 135° duotone gradient, a soft highlight, and the activity's
// emoji blown up and rotated as a faded watermark — no image files or
// network requests. The title sits on a bottom scrim so it stays legible on
// any gradient.
export function ActivityCard({
  title,
  subtitle,
  glyph,
  gradient,
  onClick,
  size = 'tile',
  children,
}: ActivityCardProps) {
  const isBanner = size === 'banner'
  const body = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.28), transparent 55%)',
        }}
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute rotate-[-12deg] leading-none opacity-35 select-none',
          isBanner ? '-right-2 -bottom-6 text-[7rem]' : '-right-3 -bottom-4 text-[5.5rem]',
        )}
      >
        {glyph}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent"
      />
      <span className="relative flex h-full flex-col justify-end p-3 text-left">
        <span
          className={cn(
            'font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
            isBanner ? 'text-xl' : 'text-sm leading-tight',
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 text-[11px] font-bold text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {subtitle}
          </span>
        )}
        {children}
      </span>
    </>
  )

  const className = cn(
    'relative block w-full overflow-hidden rounded-2xl border border-white/10 shadow-panel',
    isBanner ? 'h-28' : 'aspect-[4/3]',
    onClick && 'cursor-pointer transition-transform duration-150 active:scale-[0.97] hover:brightness-110',
  )
  const style = { background: gradientCss(gradient) }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {body}
      </button>
    )
  }
  return (
    <div className={className} style={style}>
      {body}
    </div>
  )
}
