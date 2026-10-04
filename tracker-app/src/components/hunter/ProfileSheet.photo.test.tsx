// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from '../../lib/hunterState'
import type { DevActions } from './DevTestingPanel'
import { ProfileSheet } from './ProfileSheet'

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

// jsdom has no canvas / image decoding — the resize itself is exercised in
// the browser; here it's replaced so the sheet's wiring can be tested.
vi.mock('../../lib/avatar', async (original) => ({
  ...(await original<typeof import('../../lib/avatar')>()),
  resizeToAvatar: vi.fn(async (file: File) =>
    file.type.startsWith('image/')
      ? { ok: true, dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
      : { ok: false, reason: "That file isn't an image." },
  ),
}))

const HUNTER: Hunter = { ...DEFAULT_HUNTER, name: 'Pramod', level: 3 }
const dev = new Proxy({}, { get: () => vi.fn() }) as DevActions

const open = (hunter: Hunter, onSetPhoto = vi.fn()) => {
  render(
    <ProfileSheet
      hunter={hunter}
      onRename={vi.fn()}
      onSetPhoto={onSetPhoto}
      dev={dev}
      onManageQuests={vi.fn()}
      onRetakeSetup={vi.fn()}
      onClose={vi.fn()}
    />,
  )
  return onSetPhoto
}
const choose = (file: File) =>
  fireEvent.change(screen.getByLabelText('Profile photo file'), { target: { files: [file] } })

describe('ProfileSheet — profile photo', () => {
  afterEach(cleanup)

  it('the file input only offers images', () => {
    open(HUNTER)
    expect(screen.getByLabelText('Profile photo file').getAttribute('accept')).toBe('image/*')
  })

  it('with no photo: offers Add (avatar and row), and no Remove', () => {
    open(HUNTER)
    expect(screen.getByRole('button', { name: 'Add profile photo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add photo' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })

  it('saves the RESIZED image, not the picked file', async () => {
    const onSetPhoto = open(HUNTER)
    choose(new File(['raw-camera-bytes'], 'me.heic.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(onSetPhoto).toHaveBeenCalledWith(PHOTO))
  })

  it('a non-image is refused with a message and nothing is saved', async () => {
    const onSetPhoto = open(HUNTER)
    choose(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }))
    expect((await screen.findByRole('alert')).textContent).toBe("That file isn't an image.")
    expect(onSetPhoto).not.toHaveBeenCalled()
  })

  it('with a photo: shows it, and Remove resets to the letter avatar', () => {
    const onSetPhoto = open({ ...HUNTER, photo: PHOTO })
    const avatar = screen.getByRole('button', { name: 'Change profile photo' })
    expect(avatar.querySelector('img')?.getAttribute('src')).toBe(PHOTO)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onSetPhoto).toHaveBeenCalledWith(null)
  })
})
