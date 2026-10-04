import { useCallback, useState, type ReactNode } from 'react'
import { useScreenBackground } from '../../hooks/useScreenBackground'
import { cn } from '../../lib/cn'
import type { ScreenBackgroundKey } from '../../lib/screenBackgrounds'

export interface ScreenBackgroundProps {
  /**
   * Which screen's art to show. The file is chosen for the ACTIVE THEME
   * (`<screen>.jpg` in dark, `<screen>-light.jpg` in light) along with that
   * image's own dim — see lib/screenBackgrounds.ts.
   */
  screen?: ScreenBackgroundKey
  /** Explicit image URL — overrides `screen` (tests, one-offs). Absent with no `screen` -> the ambient fallback. */
  image?: string
  /**
   * 'page' (default): an in-flow, full-height screen (a tab's root).
   * 'overlay': a fixed, full-viewport layer — for sheets like Profile that
   * sit over the current tab and want their own backdrop.
   */
  layout?: 'page' | 'overlay'
  /**
   * Extra uniform veil (0-1) on top of the standard overlay, in the theme's
   * background color (darkens in dark, lightens in light). Overrides the
   * image's own value when given.
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
// the theme's background color (--rgb-bg), strong only where chrome sits —
// behind the sticky header (top) and the tab bar (bottom) — and light
// through the middle, so the art reads through the glass cards; legibility
// there comes from the cards' fill + blur, not from burying the image. Each
// image fades in once decoded and can never shift layout; switching theme
// swaps the file and fades the new one in the same way. If it fails to load
// we drop back to the fallback.
//
// Without one (or on error): the plain bg-bg with a faint ambient glow —
// nothing to break, no empty box.
export function ScreenBackground({
  screen,
  image: imageProp,
  layout = 'page',
  dim: dimProp,
  className,
  children,
}: ScreenBackgroundProps) {
  // Always called (hooks can't be conditional); 'generic' is only a
  // placeholder key when no screen was given, and is ignored below.
  const themed = useScreenBackground(screen ?? 'generic')
  const image = imageProp ?? (screen ? themed.image : undefined)
  const dim = dimProp ?? (screen && !imageProp ? themed.dim : 0)
  // Dark-by-nature art (the summoning circle) is veiled in black in every
  // theme; everything else in the theme's own background colour.
  const darkArt = !!screen && !imageProp && themed.tone === 'dark'
  const veil = darkArt ? 'var(--fixed-art-scrim)' : 'var(--rgb-bg)'

  // Tracked per URL, so a theme switch (new file) starts hidden and fades
  // in on ITS load rather than inheriting the previous image's state.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!image && failedSrc !== image
  const loaded = loadedSrc === image

  // A cached image can finish decoding before React wires up onLoad, in
  // which case the event never fires and the art would stay at opacity-0
  // forever. Checking `complete` when the element mounts closes that gap.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoadedSrc(img.getAttribute('src'))
  }, [])

  return (
    <div
      className={cn(
        'isolate',
        darkArt ? 'bg-art-scrim' : 'bg-bg',
        layout === 'page' ? 'relative min-h-dvh' : 'fixed inset-0',
        // Text sitting straight on the art (screen titles, subtitles) gets
        // a soft halo — dark in the dark theme, light in the light one.
        // (Dark art carries its own white-on-black text styling.)
        showImage && !darkArt && '[text-shadow:var(--hud-art-text-shadow)]',
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Ambient glow — always present; it's the whole background when there's no image. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 60% at 50% -10%, rgb(var(--rgb-accent) / 0.16), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgb(var(--rgb-purple) / 0.08), transparent 60%)',
          }}
        />
        {showImage && (
          <>
            <img
              // Keyed by URL: a different file is a different element, so it
              // can't flash the old image's pixels under the new src.
              key={image}
              ref={imgRef}
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setLoadedSrc(image)}
              onError={() => setFailedSrc(image)}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
            />
            {/* Legibility overlay in the theme's background color: strong
                under the header and tab bar, light through the middle, plus
                a gentle side vignette and the image's own dim. */}
            <div
              data-testid="screen-background-overlay"
              data-dim={dim}
              data-tone={darkArt ? 'dark' : 'theme'}
              className="absolute inset-0"
              style={{
                background: [
                  `linear-gradient(180deg, rgb(${veil} / 0.85) 0%, rgb(${veil} / 0.3) 13%, rgb(${veil} / 0.18) 50%, rgb(${veil} / 0.35) 80%, rgb(${veil} / 0.92) 100%)`,
                  `radial-gradient(140% 100% at 50% 45%, transparent 55%, rgb(${veil} / 0.45) 100%)`,
                  ...(dim > 0 ? [`linear-gradient(rgb(${veil} / ${dim}), rgb(${veil} / ${dim}))`] : []),
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
