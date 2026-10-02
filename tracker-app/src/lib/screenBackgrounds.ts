// Full-bleed screen backgrounds, looked up by screen key. Drop a file named
// `<key>.{webp,jpg,jpeg,png}` into src/assets/backgrounds/ and the matching
// screen picks it up; with no file, ScreenBackground falls back to the plain
// dark background + ambient glow. All four keys currently have a file
// (1080px-tall JPEGs, ~125-165 KB each; originals live outside the app in
// ../images/backgrounds-original/). Every file in that folder is bundled
// and precached, so only the four keyed files should ever live there.

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

/** File keys present in the folder — exported so tests can catch a misnamed (never-used, still-bundled) file. */
export const SCREEN_BACKGROUND_FILES: string[] = Object.keys(BACKGROUNDS)

/** The screen's own image, else the generic one, else undefined (-> ScreenBackground's no-image fallback). */
export const resolveBackground = (
  registry: Record<string, string>,
  key: ScreenBackgroundKey,
): string | undefined => registry[key] ?? registry.generic

export const screenBackground = (key: ScreenBackgroundKey): string | undefined =>
  resolveBackground(BACKGROUNDS, key)
