import { useState, type ReactNode } from 'react'
import { gradientCss, type Gradient } from '../../lib/activities'
import { cn } from '../../lib/cn'

export interface ActivityCardProps {
  title: string
  subtitle?: string
  glyph: string
  gradient: Gradient
  /** Artwork URL (activityImage). When absent — or if it fails to load — the faded glyph is shown instead. */
  image?: string
  onClick?: () => void
  /** 'tile' for the step 1/2 grids; 'banner' for the selected activity atop step 3. */
  size?: 'tile' | 'banner'
  children?: ReactNode
}

// The library's card treatment: a per-activity 135° duotone gradient with a
// soft highlight, then either the activity's artwork (transparent PNG,
// object-contain, layered over the gradient so it still shows around and
// behind the figure) or — with no artwork — the emoji blown up and rotated
// as a faded watermark. The title sits on a bottom scrim so it stays
// legible on either. The image is absolutely positioned inside a box whose
// size never depends on it, so loading can't shift the layout.
export function ActivityCard({
  title,
  subtitle,
  glyph,
  gradient,
  image,
  onClick,
  size = 'tile',
  children,
}: ActivityCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const isBanner = size === 'banner'
  const showImage = !!image && !imageFailed

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
      {showImage ? (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          width={384}
          height={384}
          decoding="async"
          draggable={false}
          onError={() => setImageFailed(true)}
          className={cn(
            'pointer-events-none absolute object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] select-none',
            // Tiles: centered in the card. Banner: a square on the right,
            // so the title on the left never sits over the figure.
            isBanner
              ? 'top-1 right-3 aspect-square h-[calc(100%-0.5rem)] w-auto'
              : 'inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)]',
          )}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute rotate-[-12deg] leading-none opacity-35 select-none',
            isBanner ? '-right-2 -bottom-6 text-[7rem]' : '-right-3 -bottom-4 text-[5.5rem]',
          )}
        >
          {glyph}
        </span>
      )}
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
