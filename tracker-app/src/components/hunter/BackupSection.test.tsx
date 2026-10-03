// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BACKUP_APP, BACKUP_KEYS, BACKUP_VERSION } from '../../lib/backup'
import { DEFAULT_HUNTER, type Hunter } from '../../lib/hunterState'
import { BackupSection } from './BackupSection'

const CURRENT: Hunter = { ...DEFAULT_HUNTER, name: 'Current', level: 7, xp: 30 }
const BACKED_UP: Hunter = { ...DEFAULT_HUNTER, name: 'Pramod', level: 11, xp: 640, hiddenQuestIds: ['q_hunt'] }

const backupFile = (hunter: Hunter = BACKED_UP) =>
  new File(
    [
      JSON.stringify({
        app: BACKUP_APP,
        version: BACKUP_VERSION,
        exportedAt: '2026-10-03T12:00:00.000Z',
        data: { hunter, customQuests: [], theme: 'light' },
      }),
    ],
    'backup.json',
    { type: 'application/json' },
  )

const choose = (file: File) =>
  fireEvent.change(screen.getByLabelText('Backup file to restore'), { target: { files: [file] } })

const saveCurrent = () => {
  localStorage.setItem(BACKUP_KEYS.hunter, JSON.stringify(CURRENT))
  localStorage.setItem(BACKUP_KEYS.customQuests, '[]')
  localStorage.setItem(BACKUP_KEYS.theme, JSON.stringify('dark'))
}
const snapshot = () => Object.fromEntries(Object.values(BACKUP_KEYS).map((k) => [k, localStorage.getItem(k)]))

describe('BackupSection — restore', () => {
  beforeEach(saveCurrent)
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('a valid file asks for confirmation, naming both saves, before changing anything', async () => {
    const onRestored = vi.fn()
    const before = snapshot()
    render(<BackupSection current={CURRENT} onRestored={onRestored} />)
    choose(backupFile())

    const dialog = await screen.findByRole('alertdialog', { name: 'Confirm restore' })
    expect(dialog.textContent).toContain('Pramod · Level 11 · 640 XP')
    expect(dialog.textContent).toContain('saved Oct 3, 2026')
    expect(dialog.textContent).toContain('Current · Level 7 · 30 XP')
    expect(dialog.textContent).toContain("can't be undone")
    // Nothing written yet.
    expect(snapshot()).toEqual(before)
    expect(onRestored).not.toHaveBeenCalled()
  })

  it('Replace writes the whole backup and reports it', async () => {
    const onRestored = vi.fn()
    render(<BackupSection current={CURRENT} onRestored={onRestored} />)
    choose(backupFile())
    fireEvent.click(await screen.findByRole('button', { name: 'Replace' }))

    expect(JSON.parse(localStorage.getItem(BACKUP_KEYS.hunter)!)).toEqual(BACKED_UP)
    expect(JSON.parse(localStorage.getItem(BACKUP_KEYS.theme)!)).toBe('light')
    expect(onRestored).toHaveBeenCalledTimes(1)
  })

  it('Cancel leaves the current save exactly as it was', async () => {
    const onRestored = vi.fn()
    const before = snapshot()
    render(<BackupSection current={CURRENT} onRestored={onRestored} />)
    choose(backupFile())
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(snapshot()).toEqual(before)
    expect(onRestored).not.toHaveBeenCalled()
  })

  it.each([
    ['a garbage file', new File(['%PDF-1.4 not json at all'], 'x.json'), /valid JSON/],
    ['another app’s JSON', new File([JSON.stringify({ hello: 'world' })], 'x.json'), /isn't a backup from this app/],
    ['a damaged backup', backupFile({ ...BACKED_UP, level: -3 }), /damaged/],
  ])('%s is rejected with a message, no confirm, and no writes', async (_name, file, message) => {
    const onRestored = vi.fn()
    const before = snapshot()
    render(<BackupSection current={CURRENT} onRestored={onRestored} />)
    choose(file)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(message)
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(snapshot()).toEqual(before)
    expect(onRestored).not.toHaveBeenCalled()
  })

  it('a bad file after a good one clears the pending confirmation', async () => {
    render(<BackupSection current={CURRENT} onRestored={vi.fn()} />)
    choose(backupFile())
    await screen.findByRole('alertdialog')
    choose(new File(['nope'], 'x.json'))
    await screen.findByRole('alert')
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})

describe('BackupSection — first launch (nothing to replace)', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('offers only Restore, without the overwrite warning', async () => {
    const onRestored = vi.fn()
    render(<BackupSection onRestored={onRestored} />)
    expect(screen.queryByRole('button', { name: 'Download backup' })).toBeNull()
    choose(backupFile())
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog.textContent).toContain('Restore this backup?')
    expect(dialog.textContent).not.toContain("can't be undone")
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(JSON.parse(localStorage.getItem(BACKUP_KEYS.hunter)!)).toEqual(BACKED_UP)
    expect(onRestored).toHaveBeenCalled()
  })
})

describe('BackupSection — download', () => {
  const realCreate = URL.createObjectURL
  const realRevoke = URL.revokeObjectURL
  beforeEach(saveCurrent)
  afterEach(() => {
    cleanup()
    localStorage.clear()
    URL.createObjectURL = realCreate
    URL.revokeObjectURL = realRevoke
    vi.restoreAllMocks()
  })

  it('saves one JSON file named after the hunter and date, containing the whole save', async () => {
    let saved: Blob | undefined
    URL.createObjectURL = vi.fn((b: Blob) => {
      saved = b
      return 'blob:x'
    }) as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn()
    let downloadName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download
    })

    render(<BackupSection current={CURRENT} onRestored={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))

    expect(downloadName).toMatch(/^tracker-backup-current-\d{4}-\d{2}-\d{2}\.json$/)
    const parsed = JSON.parse(await saved!.text())
    expect(parsed).toMatchObject({
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      data: { hunter: CURRENT, customQuests: [], theme: 'dark' },
    })
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain(downloadName))
  })
})
