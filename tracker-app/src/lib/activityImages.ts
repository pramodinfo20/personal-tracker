// Artwork for ACTIVITY_LIBRARY entries, keyed by activity id. Each file in
// src/assets/activities/ is named exactly `<activity id>.png` (384px square,
// transparent background — resized down from the original generated art),
// so adding art for another activity is just dropping in a correctly named
// file. Activities with no file here (currently Language Practice and
// Interview Prep) fall back to ActivityCard's gradient + emoji treatment.

const files = import.meta.glob<string>('../assets/activities/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const fileId = (path: string): string => path.slice(path.lastIndexOf('/') + 1, -'.png'.length)

const IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [fileId(path), url]),
)

/** Ids that have artwork — exported for tests (a misnamed file would otherwise silently fall back). */
export const ACTIVITY_IMAGE_IDS: string[] = Object.keys(IMAGES)

export const activityImage = (activityId: string): string | undefined => IMAGES[activityId]
