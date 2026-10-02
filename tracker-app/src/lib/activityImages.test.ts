import { describe, expect, it } from 'vitest'
import { ACTIVITY_LIBRARY } from './activities'
import { ACTIVITY_IMAGE_IDS, activityImage } from './activityImages'

const WITH_ART = [
  'running',
  'cycling',
  'gym',
  'yoga',
  'walking',
  'swimming',
  'reading',
  'studying',
  'coding',
  'water',
  'meditation',
  'journaling',
  'sleep',
  'job_apps',
  'networking',
  'general',
]

describe('activityImage', () => {
  it('every artwork file is named after a real activity id (no orphaned/misnamed files)', () => {
    const ids = new Set(ACTIVITY_LIBRARY.map((a) => a.id))
    for (const id of ACTIVITY_IMAGE_IDS) expect(ids.has(id)).toBe(true)
  })

  it('has artwork for exactly the 16 activities the images were made for', () => {
    expect([...ACTIVITY_IMAGE_IDS].sort()).toEqual([...WITH_ART].sort())
    for (const id of WITH_ART) expect(activityImage(id)).toMatch(/\.png/)
  })

  it('leaves the two later additions on the gradient + emoji fallback', () => {
    expect(activityImage('language')).toBeUndefined()
    expect(activityImage('interview_prep')).toBeUndefined()
  })
})
