import { useRef, useState, type ChangeEvent } from 'react'
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

const saveFile = (filename: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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

  const download = () => {
    setError(null)
    const backup = buildBackup(localStorage)
    if (!backup) {
      setError('Nothing to back up yet.')
      return
    }
    const filename = backupFilename(backup.data.hunter.name)
    saveFile(filename, JSON.stringify(backup, null, 2))
    setDownloaded(filename)
  }

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so choosing the same file again still fires a change event.
    e.target.value = ''
    if (!file) return
    setDownloaded(null)
    setPending(null)
    const result = parseBackup(await file.text())
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setError(null)
    setPending(result.backup)
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
        <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()} className="flex-1">
          Restore from file
        </Button>
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
