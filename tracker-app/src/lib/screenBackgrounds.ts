// Full-bleed screen backgrounds, looked up by screen key. Drop a file named
// `<key>.{webp,jpg,jpeg,png}` into src/assets/backgrounds/ and the matching
// screen picks it up; with no file, ScreenBackground falls back to the plain
// dark background + ambient glow. No file exists yet for any key — the
// artwork is generated separately.

export type ScreenBackgroundKey = 'today' | 'gate' | 'profile' | 'generic'

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

/** The screen's own image, else the generic one, else undefined (fallback). */
export const screenBackground = (key: ScreenBackgroundKey): string | undefined =>
  BACKGROUNDS[key] ?? BACKGROUNDS.generic
