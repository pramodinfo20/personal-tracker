// Profile photo: picked from the device, shrunk in the browser, and kept as
// a small JPEG data URL on the hunter save (Hunter.photo) — no backend. A
// raw phone photo is several MB and localStorage holds ~5 MB in total, so
// nothing but the resized result is ever stored.

/** Stored photos are square, this many pixels a side (covers a 3x-density 64px avatar). */
export const AVATAR_SIZE = 256
const JPEG_QUALITY = 0.85
/** Anything bigger than this isn't something resizeToAvatar produced. */
export const AVATAR_MAX_CHARS = 200_000

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/

// Is this a photo the app can safely store and render? Used for backups
// too, so a restored file can't smuggle in a huge or non-image value.
export const isAvatarDataUrl = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= AVATAR_MAX_CHARS && DATA_URL.test(v)

export interface CropRect {
  sx: number
  sy: number
  size: number
}

// The largest centered square of a w x h image — what gets scaled down to
// the avatar, so a portrait or landscape photo is cropped, not squashed.
export const centerSquare = (width: number, height: number): CropRect => {
  const size = Math.min(width, height)
  return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size }
}

export type AvatarResult = { ok: true; dataUrl: string } | { ok: false; reason: string }

const loadImage = (file: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    img.src = url
  })

// Picked file -> square AVATAR_SIZE JPEG data URL. Never throws: anything
// that isn't a readable image comes back as a reason to show the user.
export const resizeToAvatar = async (file: File): Promise<AvatarResult> => {
  if (!file.type.startsWith('image/')) {
    return { ok: false, reason: "That file isn't an image." }
  }
  try {
    const img = await loadImage(file)
    const { sx, sy, size } = centerSquare(img.naturalWidth, img.naturalHeight)
    if (size <= 0) return { ok: false, reason: "That image couldn't be read." }
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: false, reason: "This browser can't process images." }
    // JPEG has no transparency — put transparent PNGs on white, not black.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    if (!isAvatarDataUrl(dataUrl)) return { ok: false, reason: "That image couldn't be processed." }
    return { ok: true, dataUrl }
  } catch {
    return { ok: false, reason: "That image couldn't be read — try a JPEG or PNG." }
  }
}
