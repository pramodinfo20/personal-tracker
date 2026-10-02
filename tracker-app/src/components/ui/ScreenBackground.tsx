import { useCallback, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface ScreenBackgroundProps {
  /** Image URL (see screenBackground()). Absent -> the ambient fallback. */
  image?: string
  /**
   * 'page' (default): an in-flow, full-height screen (a tab's root).
   * 'overlay': a fixed, full-viewport layer — for sheets like Profile that
   * sit over the current tab and want their own backdrop.
   */
  layout?: 'page' | 'overlay'
  className?: string
  children: ReactNode
}

// Full-bleed atmospheric backdrop behind a screen's content.
//
// With an image: it's fixed to the viewport (object-fit: cover, so any
// aspect ratio fills a 390px phone without distortion) and covered by a dark
// overlay that fades to the app's deep-navy --color-bg toward the edges and
// bottom — foreground glass cards and text stay legible however busy the
// art is. The image fades in once decoded and sits in a fixed layer, so it
// can never shift layout; if it fails to load we drop back to the fallback.
//
// Without one (or on error): the plain bg-bg with a faint ambient glow —
// nothing to break, no empty box.
export function ScreenBackground({
  image,
  layout = 'page',
  className,
  children,
}: ScreenBackgroundProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showImage = !!image && !failed

  // A cached image can finish decoding before React wires up onLoad, in
  // which case the event never fires and the art would stay at opacity-0
  // forever. Checking `complete` when the element mounts closes that gap.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [])

  return (
    <div
      className={cn(
        'isolate bg-bg',
        layout === 'page' ? 'relative min-h-dvh' : 'fixed inset-0',
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Ambient glow — always present; it's the whole background when there's no image. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 60% at 50% -10%, rgb(47 143 255 / 0.16), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgb(168 85 247 / 0.08), transparent 60%)',
          }}
        />
        {showImage && (
          <>
            <img
              ref={imgRef}
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
            />
            {/* Legibility overlay: darkens the whole image, then fades fully
                to --color-bg at the bottom and edges. */}
            <div
              data-testid="screen-background-overlay"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgb(10 14 26 / 0.55) 0%, rgb(10 14 26 / 0.7) 40%, rgb(10 14 26 / 0.92) 75%, var(--color-bg) 100%), radial-gradient(130% 90% at 50% 30%, transparent 40%, var(--color-bg) 100%)',
              }}
            />
          </>
        )}
      </div>
      {children}
    </div>
  )
}
