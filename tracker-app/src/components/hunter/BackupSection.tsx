import { useRef, useState, type ChangeEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { useAndroidBackAction } from '../../hooks/useAndroidBackAction'
import {
  applyBackup,
  backupFilename,
  buildBackup,
  describeHunter,
  parseBackup,
  type Backup,
} from '../../lib/backup'
import type { Hunter } from '../../lib/hunterState'
import { formatJoinDate } from '../../lib/profile'
import { Button } from '../ui'

export interface BackupSectionProps {
  /**
   * The current save, for the "replace X with Y?" confirmation. Omit on
   * first launch (nothing to replace yet): only Restore is offered, and it
   * skips the overwrite warning.
   */
  current?: Hunter
  /**
   * Called after a successful restore. The restore writes storage directly,
   * so the app must reload to pick it up — the default does exactly that.
   */
  onRestored?: () => void
}

const BACKUP_FOLDER = 'Personal Tracker'
const BACKUP_LOCATION = `Documents/${BACKUP_FOLDER}`

const isNative = () => Capacitor.isNativePlatform()

const saveFile = async (filename: string, text: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.writeFile({
        path: `${BACKUP_FOLDER}/${filename}`,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      })
      return `${BACKUP_LOCATION}/${filename}`
    } catch {
      await Filesystem.writeFile({
        path: filename,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
      return `Documents/${filename}`
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return filename
}

const textFromFileResult = async (data: string | Blob): Promise<string> =>
  typeof data === 'string' ? data : data.text()

const readLatestNativeBackup = async (): Promise<{ name: string; text: string } | null> => {
  const entries = await Filesystem.readdir({
    path: BACKUP_FOLDER,
    directory: Directory.Documents,
  })
  const latest = entries.files
    .filter(
      (file) =>
        file.type === 'file' &&
        file.name.startsWith('personal-tracker-backup-') &&
        file.name.endsWith('.json'),
    )
    .sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0) || b.name.localeCompare(a.name))[0]
  if (!latest) return null
  const result = await Filesystem.readFile({
    path: `${BACKUP_FOLDER}/${latest.name}`,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  })
  return { name: latest.name, text: await textFromFileResult(result.data) }
}

// Download the whole save as one JSON file, and restore from such a file.
// A restore is validated before anything is touched, always asks before
// overwriting existing progress, and is all-or-nothing (lib/backup.ts).
export function BackupSection({
  current,
  onRestored = () => window.location.reload(),
}: BackupSectionProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState<string | null>(null)
  const [restoringLatest, setRestoringLatest] = useState(false)
  useAndroidBackAction(pending !== null, () => setPending(null), 200)

  const download = async () => {
    setError(null)
    const backup = buildBackup(localStorage)
    if (!backup) {
      setError('Nothing to back up yet.')
      return
    }
    const filename = backupFilename(backup.data.hunter.name)
    try {
      setDownloaded(await saveFile(filename, JSON.stringify(backup, null, 2)))
    } catch {
      setError("Couldn't save the backup file on this device.")
    }
  }

  const loadBackupText = (text: string) => {
    const result = parseBackup(text)
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setError(null)
    setPending(result.backup)
  }

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so choosing the same file again still fires a change event.
    e.target.value = ''
    if (!file) return
    setDownloaded(null)
    setPending(null)
    loadBackupText(await file.text())
  }

  const restoreLatest = async () => {
    setError(null)
    setDownloaded(null)
    setPending(null)
    setRestoringLatest(true)
    try {
      const latest = await readLatestNativeBackup()
      if (!latest) {
        setError(`No backup files found in ${BACKUP_LOCATION}.`)
        return
      }
      loadBackupText(latest.text)
    } catch {
      setError(`Couldn't read backups from ${BACKUP_LOCATION}. Use Restore from file instead.`)
    } finally {
      setRestoringLatest(false)
    }
  }

  const openPicker = () => {
    setError(null)
    setDownloaded(null)
    setPending(null)
    fileInput.current?.click()
  }

  const restore = () => {
    if (!pending) return
    const result = applyBackup(pending, localStorage)
    if (!result.ok) {
      setPending(null)
      setError(result.reason)
      return
    }
    onRestored()
  }

  const exportedOn = pending?.exportedAt ? formatJoinDate(pending.exportedAt.slice(0, 10)) : null

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {current && (
          <Button type="button" variant="secondary" onClick={download} className="flex-1">
            Download backup
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={openPicker} className="flex-1">
          Restore from file
        </Button>
        {isNative() && (
          <Button
            type="button"
            variant="secondary"
            onClick={restoreLatest}
            disabled={restoringLatest}
            className="flex-1"
          >
            {restoringLatest ? 'Finding backup…' : 'Restore latest backup'}
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onFileChosen}
          aria-label="Backup file to restore"
          className="sr-only"
        />
      </div>

      {downloaded && (
        <p role="status" className="mt-2 text-[11px] text-text-secondary">
          Saved <span className="font-mono">{downloaded}</span> — keep it somewhere safe.
        </p>
      )}

      <p className="mt-2 text-[11px] text-text-secondary">
        Backups are normally saved in <span className="font-mono">{BACKUP_LOCATION}</span>.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-xs font-bold text-warning">
          {error}
        </p>
      )}

      {pending && (
        <div
          role="alertdialog"
          aria-label="Confirm restore"
          className="mt-3 rounded-xl border border-warning/50 bg-warning/10 p-3"
        >
          <p className="text-xs font-bold text-text-primary">
            {current ? 'Replace your current progress with this backup?' : 'Restore this backup?'}
          </p>
          <dl className="mt-2 space-y-1 text-xs text-text-secondary">
            <div>
              <dt className="inline font-bold">Backup: </dt>
              <dd className="inline">
                {describeHunter(pending.data.hunter)}
                {exportedOn && ` — saved ${exportedOn}`}
              </dd>
            </div>
            {current && (
              <div>
                <dt className="inline font-bold">Current: </dt>
                <dd className="inline">{describeHunter(current)}</dd>
              </div>
            )}
          </dl>
          {current && (
            <p className="mt-2 text-[11px] text-text-secondary">
              Your current level, XP, history and custom quests will be overwritten. This can't
              be undone — download a backup first if you might want them back.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setPending(null)} className="flex-1">
              Cancel
            </Button>
            <Button type="button" onClick={restore} className="flex-1">
              {current ? 'Replace' : 'Restore'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
