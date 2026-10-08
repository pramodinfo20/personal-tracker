// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_HUNTER, type Hunter } from '../../lib/hunterState'
import type { DevActions } from './DevTestingPanel'
import { PRIVACY_POLICY_PATH, PRIVACY_POLICY_URL, ProfileSheet } from './ProfileSheet'

const isNativePlatform = vi.fn(() => false)

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}))

const HUNTER: Hunter = { ...DEFAULT_HUNTER, name: 'Pramod', level: 3 }
const dev = new Proxy({}, { get: () => vi.fn() }) as DevActions

const open = () => {
  render(
    <ProfileSheet
      hunter={HUNTER}
      onRename={vi.fn()}
      onSetPhoto={vi.fn()}
      dev={dev}
      onManageQuests={vi.fn()}
      onRetakeSetup={vi.fn()}
      onClose={vi.fn()}
    />,
  )
}

describe('ProfileSheet — privacy policy link', () => {
  afterEach(() => {
    cleanup()
    isNativePlatform.mockReturnValue(false)
    vi.restoreAllMocks()
  })

  it('opens the bundled privacy page for web and PWA', () => {
    const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null)
    open()

    fireEvent.click(screen.getByRole('button', { name: /Privacy Policy/ }))

    expect(openWindow).toHaveBeenCalledWith(PRIVACY_POLICY_PATH, '_blank', 'noopener,noreferrer')
  })

  it('opens the public HTTPS policy in the system browser on native Android', () => {
    isNativePlatform.mockReturnValue(true)
    const openWindow = vi.spyOn(window, 'open').mockImplementation(() => null)
    open()

    fireEvent.click(screen.getByRole('button', { name: /Privacy Policy/ }))

    expect(openWindow).toHaveBeenCalledWith(PRIVACY_POLICY_URL, '_system', 'noopener,noreferrer')
  })
})
