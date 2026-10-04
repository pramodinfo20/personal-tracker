// Companion artwork. Every companion has an image of its own in
// src/assets/companions/ — "stone-golem.jpg", "void-dragon.jpg" … named by
// the companion's `art` key (lib/companions.ts) — shown on its card once
// recruited and as the hero of a summon reveal.
//
// The six "companion-<rank>.jpg" files are the per-rank images from before
// each companion had its own. They are now only a FALLBACK: used if a
// companion's own file is missing or misnamed, never as the normal path.
// (One exception by design: "companion-d.jpg" is the Grey Wolf's own art —
// the D-rank image always was that wolf.)
//
// All are 600x800 JPEGs under 150 KB; the originals live outside the app in
// ../images/backgrounds-original/.

import type { Companion, CompanionRank } from './companions'

const files = import.meta.glob<string>('../assets/companions/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})

// "…/void-dragon.jpg" -> "void-dragon"
const fileKey = (path: string): string => path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))

const ART: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [fileKey(path), url]),
)

/** Every file key in the folder — exported so tests can catch a missing, stray or misnamed file. */
export const COMPANION_ART_FILES: string[] = Object.keys(ART)

export const rankArtKey = (rank: CompanionRank): string => `companion-${rank.toLowerCase()}`

/** The per-rank fallback image. */
export const rankArt = (rank: CompanionRank): string | undefined => ART[rankArtKey(rank)]

/** Whether this companion's own file exists (false = it would show the rank fallback). */
export const hasOwnArt = (companion: Pick<Companion, 'art'>): boolean => companion.art in ART

// A companion's image: its own, else its rank's, else undefined (callers
// then fall back to the companion's icon).
export const companionArt = (companion: Pick<Companion, 'art' | 'rank'>): string | undefined =>
  ART[companion.art] ?? rankArt(companion.rank)
