// Full-bleed screen backgrounds, looked up by screen key AND theme. Each
// screen has a dark file `<key>.jpg` and a light file `<key>-light.jpg` in
// src/assets/backgrounds/ (separately drawn art, not a re-tint); the active
// theme decides which one ScreenBackground shows. With no file for a
// key+theme it falls back to that theme's generic image, then to the plain
// background + ambient glow. The summoning circle is the one exception: a
// single dark image used in both themes. All nine exist (1080px-tall JPEGs,
// ~130-280 KB each; originals live outside the app in
// ../images/backgrounds-original/). Every file in that folder is bundled
// and precached, so only those keyed files should ever live there.

import type { ResolvedTheme } from './theme'

export type ScreenBackgroundKey = 'today' | 'gate' | 'profile' | 'generic' | 'summon-circle'

// Art that is dark by nature and shown as-is in BOTH themes (no -light
// file): the summoning circle. ScreenBackground veils these in black rather
// than the theme's background colour, and text placed on them uses the
// on-art colours.
const DARK_ART: ReadonlySet<ScreenBackgroundKey> = new Set(['summon-circle'])

/** Whether a screen's art is the same dark image in every theme. */
export const isDarkArt = (key: ScreenBackgroundKey): boolean => DARK_ART.has(key)

/** The file key for a screen in a theme: 'today' / 'today-light'. */
export const backgroundFileKey = (key: ScreenBackgroundKey, theme: ResolvedTheme): string =>
  theme === 'light' && !isDarkArt(key) ? `${key}-light` : key

const files = import.meta.glob<string>('../assets/backgrounds/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const fileKey = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))

const BACKGROUNDS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [fileKey(path), url]),
)

/** File keys present in the folder — exported so tests can catch a misnamed (never-used, still-bundled) file. */
export const SCREEN_BACKGROUND_FILES: string[] = Object.keys(BACKGROUNDS)

/**
 * Which file a screen resolves to in a theme: its own, else that theme's
 * generic one, else undefined (-> ScreenBackground's no-image fallback).
 * Never crosses themes — a dark image under a light UI (or vice versa) is
 * worse than no image.
 */
export const resolveBackgroundKey = (
  registry: Record<string, string>,
  key: ScreenBackgroundKey,
  theme: ResolvedTheme = 'dark',
): string | undefined =>
  [backgroundFileKey(key, theme), backgroundFileKey('generic', theme)].find((k) => k in registry)

export const resolveBackground = (
  registry: Record<string, string>,
  key: ScreenBackgroundKey,
  theme: ResolvedTheme = 'dark',
): string | undefined => {
  const fileKey = resolveBackgroundKey(registry, key, theme)
  return fileKey ? registry[fileKey] : undefined
}

export const screenBackground = (
  key: ScreenBackgroundKey,
  theme: ResolvedTheme = 'dark',
): string | undefined => resolveBackground(BACKGROUNDS, key, theme)

// Extra veil an image needs on top of the standard overlay, per FILE (so per
// theme). It's a property of the artwork, not of the screen showing it. The
// veil is always the theme's background color — it darkens in dark, lightens
// in light — pulling the art toward the surface the text was designed for.
// Each value is the smallest that keeps every text element at WCAG AA over
// that image (measured, see the theme/contrast work).
const BACKGROUND_DIM: Record<string, number> = {
  generic: 0.35,
  gate: 0.45,
  today: 0.35,
  // profile (dark nebula) needs none.
  // Light art: dark text over bright images passes AA with no veil at all
  // (measured), so these are small and purely to keep the scene calm.
  'today-light': 0.15,
  'gate-light': 0.15,
  'profile-light': 0.1,
  'generic-light': 0.15,
  // The summoning circle is bright through the middle, right where the
  // reveal sits; this keeps white text on it at AA.
  'summon-circle': 0.3,
}

/** Spread into <ScreenBackground>: the image URL plus that image's dim. */
export const screenBackgroundProps = (
  key: ScreenBackgroundKey,
  theme: ResolvedTheme = 'dark',
): { image: string | undefined; dim: number; tone: 'theme' | 'dark' } => {
  // Keyed by the file actually shown — a screen falling back to the generic
  // art inherits generic's dim.
  const fileKey = resolveBackgroundKey(BACKGROUNDS, key, theme)
  return {
    image: fileKey ? BACKGROUNDS[fileKey] : undefined,
    dim: fileKey ? (BACKGROUND_DIM[fileKey] ?? 0) : 0,
    // 'dark' only when the dark art itself is what's showing (not a fallback).
    tone: isDarkArt(key) && fileKey === key ? 'dark' : 'theme',
  }
}
