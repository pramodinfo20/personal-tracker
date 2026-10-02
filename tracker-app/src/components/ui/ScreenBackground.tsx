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
  /**
   * Extra uniform darkening (0-1) on top of the standard overlay, for a
   * screen whose content needs a calmer backdrop than the default — e.g.
   * Progress, where the bright generic art sits behind charts.
   */
  dim?: number
  className?: string
  children: ReactNode
}

// Full-bleed atmospheric backdrop behind a screen's content.
//
// With an image: it's fixed to the viewport (object-fit: cover, so any
// aspect ratio fills a 390px phone without distortion). Because the layer is
// position: fixed, it covers the visible area at every scroll position — a
// screen taller than the viewport scrolls its content over the art; there's
// never a point where the image ends and flat color shows. The overlay is
// dark only where chrome sits — behind the sticky header (top) and the tab
// bar (bottom) — and light through the middle, so the art reads through the
// glass cards; legibility there comes from the cards' blur + glow, not from
// burying the image. The image fades in once decoded and can never shift
// layout; if it fails to load we drop back to the fallback.
//
// Without one (or on error): the plain bg-bg with a faint ambient glow —
// nothing to break, no empty box.
export function ScreenBackground({
  image,
  layout = 'page',
  dim = 0,
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
        // Text sitting straight on the art (screen titles, subtitles) gets
        // the same soft shadow glass surfaces give their text.
        showImage && '[text-shadow:0_1px_3px_rgb(0_0_0/0.7)]',
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
            {/* Legibility overlay: dark under the header and tab bar, light
                through the middle, plus a gentle side vignette. */}
            <div
              data-testid="screen-background-overlay"
              className="absolute inset-0"
              style={{
                background: [
                  'linear-gradient(180deg, rgb(10 14 26 / 0.85) 0%, rgb(10 14 26 / 0.3) 13%, rgb(10 14 26 / 0.18) 50%, rgb(10 14 26 / 0.35) 80%, rgb(10 14 26 / 0.92) 100%)',
                  'radial-gradient(140% 100% at 50% 45%, transparent 55%, rgb(10 14 26 / 0.45) 100%)',
                  ...(dim > 0 ? [`linear-gradient(rgb(10 14 26 / ${dim}), rgb(10 14 26 / ${dim}))`] : []),
                ].join(', '),
              }}
            />
          </>
        )}
      </div>
      {children}
    </div>
  )
}
