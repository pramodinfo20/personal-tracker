import { describe, expect, it } from 'vitest'
import { AVATAR_MAX_CHARS, centerSquare, isAvatarDataUrl } from './avatar'

describe('isAvatarDataUrl', () => {
  it('accepts small base64 JPEG / PNG / WebP data URLs', () => {
    expect(isAvatarDataUrl('data:image/jpeg;base64,/9j/4AAQ==')).toBe(true)
    expect(isAvatarDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    expect(isAvatarDataUrl('data:image/webp;base64,UklGRg')).toBe(true)
  })

  it('rejects anything else', () => {
    for (const bad of [
      undefined,
      null,
      '',
      42,
      'https://example.com/a.jpg',
      'javascript:alert(1)',
      'data:text/html;base64,PGI+',
      'data:image/svg+xml;base64,PHN2Zy8+',
      'data:image/jpeg;base64,not base64!',
      'data:image/jpeg,raw',
    ]) {
      expect(isAvatarDataUrl(bad)).toBe(false)
    }
  })

  it('rejects one too large to be a resized avatar', () => {
    const prefix = 'data:image/jpeg;base64,'
    expect(isAvatarDataUrl(prefix + 'A'.repeat(AVATAR_MAX_CHARS - prefix.length))).toBe(true)
    expect(isAvatarDataUrl(prefix + 'A'.repeat(AVATAR_MAX_CHARS))).toBe(false)
  })
})

describe('centerSquare', () => {
  it('crops a landscape photo to its middle', () => {
    expect(centerSquare(4000, 3000)).toEqual({ sx: 500, sy: 0, size: 3000 })
  })
  it('crops a portrait photo to its middle', () => {
    expect(centerSquare(3000, 4000)).toEqual({ sx: 0, sy: 500, size: 3000 })
  })
  it('leaves a square photo whole', () => {
    expect(centerSquare(512, 512)).toEqual({ sx: 0, sy: 0, size: 512 })
  })
})
