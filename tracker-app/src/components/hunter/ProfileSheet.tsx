import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import type { Hunter } from '../../lib/hunterState'
import { rankForLevel } from '../../lib/leveling'
import { cn } from '../../lib/cn'
import { isDevToolsEnabled, isLiveBuild } from '../../lib/devToolsGate'
import { resizeToAvatar } from '../../lib/avatar'
import { formatJoinDate, joinDateFor, profileDetails } from '../../lib/profile'
import { Badge, Button, ScreenBackground, ThemeToggle } from '../ui'
import { Avatar } from './Avatar'
import { BackupSection } from './BackupSection'
import { DevTestingPanel, type DevActions } from './DevTestingPanel'
import { glowClass, rankTierColor } from './tierMapping'

export const PRIVACY_POLICY_PATH = '/privacy.html'
export const PRIVACY_POLICY_URL = 'https://personal-tracker-omega-ten.vercel.app/privacy.html'

const openPrivacyPolicy = () => {
  if (Capacitor.isNativePlatform()) {
    window.open(PRIVACY_POLICY_URL, '_system', 'noopener,noreferrer')
    return
  }
  window.open(PRIVACY_POLICY_PATH, '_blank', 'noopener,noreferrer')
}

export interface ProfileSheetProps {
  hunter: Hunter
  onRename: (name: string) => void
  /** Save an already-resized photo (lib/avatar.ts), or null to remove it. */
  onSetPhoto: (photo: string | null) => void
  dev: DevActions
  /** Opens the Manage Quests screen (the caller closes this sheet). */
  onManageQuests: () => void
  /** Re-opens the setup flow, prefilled (the caller closes this sheet). */
  onRetakeSetup: () => void
  onClose: () => void
}

// Opened from the header avatar on every screen: a glass bottom sheet over
// the profile backdrop (its own ScreenBackground in 'overlay' layout, in
// place of a dimmed view of the current tab). Tapping the backdrop closes it.
export function ProfileSheet({
  hunter,
  onRename,
  onSetPhoto,
  dev,
  onManageQuests,
  onRetakeSetup,
  onClose,
}: ProfileSheetProps) {
  const rank = rankForLevel(hunter.level || 1)
  const joined = joinDateFor(hunter)
  const details = profileDetails(hunter)
  const [name, setName] = useState(hunter.name)
  const trimmed = name.trim()
  const nameChanged = trimmed.length > 0 && trimmed !== hunter.name

  const photoInput = useRef<HTMLInputElement>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const pickPhoto = () => photoInput.current?.click()

  // The picked file is shrunk to a small square JPEG before it goes
  // anywhere near the save — the original is never stored.
  const onPhotoChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so picking the same file again still fires
    if (!file) return
    setPhotoError(null)
    setPhotoBusy(true)
    const result = await resizeToAvatar(file)
    setPhotoBusy(false)
    if (result.ok) onSetPhoto(result.dataUrl)
    else setPhotoError(result.reason)
  }

  const removePhoto = () => {
    setPhotoError(null)
    onSetPhoto(null)
  }

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    if (nameChanged) onRename(trimmed)
  }

  return (
    <ScreenBackground screen="profile" layout="overlay" className="z-40">
      <div className="flex h-full items-end justify-center" onClick={onClose}>
        <div
          role="dialog"
          aria-label="Profile"
          className={cn(
            'hud-glass hud-glass-strong max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border-b-0 p-5 pb-8',
            glowClass(rankTierColor(rank.name)),
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-text-primary uppercase">Profile</h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-2xl leading-none text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={pickPhoto}
              aria-label={hunter.photo ? 'Change profile photo' : 'Add profile photo'}
              className="hud-pressable relative shrink-0 cursor-pointer rounded-full"
            >
              <Avatar name={hunter.name} photo={hunter.photo} className="h-16 w-16 text-2xl" />
              <span
                aria-hidden="true"
                className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-xs"
              >
                📷
              </span>
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              aria-label="Profile photo file"
              className="hidden"
              onChange={onPhotoChosen}
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold text-text-primary">{hunter.name}</div>
              <div className="text-xs font-bold text-text-secondary">Level {hunter.level || 1}</div>
              <Badge tier={rankTierColor(rank.name)} className="mt-1">
                {rank.emoji} {rank.name}
              </Badge>
            </div>
          </div>
          {joined && (
            <div className="mt-3 text-xs text-text-muted">
              {joined.approximate ? 'Active since' : 'Joined'} {formatJoinDate(joined.date)}
            </div>
          )}
          {/* Optional details from setup — display only. */}
          {details.length > 0 && (
            <div className="mt-1 text-xs text-text-secondary">{details.join(' · ')}</div>
          )}

          <button
            type="button"
            onClick={onManageQuests}
            className="hud-inset hud-pressable mt-6 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">
                🗒️
              </span>
              <span>
                <span className="block text-sm font-bold text-text-primary">Manage Quests</span>
                <span className="block text-xs text-text-secondary">
                  Show or hide quests on Today, add your own
                </span>
              </span>
            </span>
            <span className="text-xl text-text-secondary" aria-hidden="true">
              ›
            </span>
          </button>

          <h3 className="mt-6 mb-2 text-xs font-bold tracking-wide text-text-secondary uppercase">
            Settings
          </h3>
          <div className="hud-inset divide-y divide-hairline overflow-hidden rounded-2xl">
            <div className="px-4 py-3">
              <div className="mb-1.5 text-xs font-bold text-text-secondary">🎨 Appearance</div>
              <ThemeToggle />
            </div>
            <form onSubmit={saveName} className="px-4 py-3">
              <label htmlFor="profile-name" className="mb-1.5 block text-xs font-bold text-text-secondary">
                ✏️ Hunter name
              </label>
              <div className="flex gap-2">
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-backing/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <Button type="submit" disabled={!nameChanged} className="shrink-0">
                  Save
                </Button>
              </div>
            </form>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-text-secondary">📷 Profile photo</span>
                <span className="flex shrink-0 gap-2">
                  {hunter.photo && (
                    <Button type="button" variant="secondary" onClick={removePhoto}>
                      Remove
                    </Button>
                  )}
                  <Button type="button" variant="secondary" onClick={pickPhoto} disabled={photoBusy}>
                    {photoBusy ? 'Working…' : hunter.photo ? 'Change' : 'Add photo'}
                  </Button>
                </span>
              </div>
              {photoError && (
                <p role="alert" className="mt-2 text-xs font-bold text-warning">
                  {photoError}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onRetakeSetup}
              className="hud-pressable flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">
                  🧭
                </span>
                <span>
                  <span className="block text-sm font-bold text-text-primary">Retake setup</span>
                  <span className="block text-xs text-text-secondary">
                    Update your details and goals
                  </span>
                </span>
              </span>
              <span className="text-xl text-text-secondary" aria-hidden="true">
                ›
              </span>
            </button>
            <button
              type="button"
              onClick={openPrivacyPolicy}
              className="hud-pressable flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">
                  🔒
                </span>
                <span>
                  <span className="block text-sm font-bold text-text-primary">Privacy Policy</span>
                  <span className="block text-xs text-text-secondary">
                    How Personal Tracker handles local data
                  </span>
                </span>
              </span>
              <span className="text-xl text-text-secondary" aria-hidden="true">
                ↗
              </span>
            </button>
          </div>

          <h3 className="mt-6 mb-2 text-xs font-bold tracking-wide text-text-secondary uppercase">
            Your data
          </h3>
          <div className="hud-inset rounded-2xl px-4 py-3">
            <p className="mb-2.5 text-xs text-text-secondary">
              Everything is stored only in this browser. Download a backup to keep your progress
              safe, or to move it to another device.
            </p>
            <BackupSection current={hunter} />
          </div>

          {/* Dev Testing: dev builds, or a live build made with
              VITE_ENABLE_DEV_TOOLS=true in a browser unlocked via ?devtools=1.
              The same isDevToolsEnabled() guards the actions in useHunter. */}
          {isDevToolsEnabled() && (
            <DevTestingPanel hunter={hunter} dev={dev} onClose={onClose} live={isLiveBuild()} />
          )}
        </div>
      </div>
    </ScreenBackground>
  )
}
