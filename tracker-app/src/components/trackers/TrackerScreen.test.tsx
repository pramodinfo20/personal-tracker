// @vitest-environment jsdom
// The one shared tracker screen, run as each of Skills, Certs and Projects
// on the real useTracker hook.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useTracker } from '../../hooks/useTracker'
import { CERTS, PROJECTS, SKILLS, TRACKERS, type TrackerDef, type TrackerItem } from '../../lib/trackers'
import { TrackerScreen } from './TrackerScreen'

function Harness({ def }: { def: TrackerDef }) {
  return <TrackerScreen def={def} list={useTracker(def)} onBack={() => {}} />
}

const saved = (def: TrackerDef) => JSON.parse(localStorage.getItem(def.storageKey) ?? '[]') as TrackerItem[]
const seed = (def: TrackerDef, items: Record<string, string>[]) =>
  localStorage.setItem(
    def.storageKey,
    JSON.stringify(items.map((fields, i) => ({ id: `${def.id}_${i}`, createdAt: `2026-10-0${i + 1}T09:00:00.000Z`, ...fields }))),
  )

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const inSheet = (name: string) => within(screen.getByRole('dialog')).getByRole('button', { name })
const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe.each(TRACKERS)('TrackerScreen — $title', (def) => {
  const titleLabel = `${def.fields[0].label} (required)`
  // A saved record always carries its choice field (level / status), if the tracker has one.
  const choice = def.fields.find((f) => f.kind === 'choice')
  const base: Record<string, string> =
    choice && choice.kind === 'choice' ? { [choice.key]: choice.options[0].value } : {}

  it('starts empty', () => {
    render(<Harness def={def} />)
    expect(screen.getByText(`No ${def.plural} yet`)).toBeTruthy()
    expect(screen.getByText(`0 ${def.plural}`)).toBeTruthy()
  })

  it('add: the title is required, then the card appears', () => {
    render(<Harness def={def} />)
    fireEvent.click(button(`Add ${def.singular}`))
    fireEvent.click(inSheet(`Add ${def.singular}`))
    expect(screen.getByRole('alert').textContent).toBe(`${def.fields[0].label} is required.`)
    expect(saved(def)).toEqual([])

    fill(titleLabel, 'First entry')
    fireEvent.click(inSheet(`Add ${def.singular}`))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(saved(def)).toMatchObject([{ title: 'First entry' }])
    expect(button('Edit First entry')).toBeTruthy()
    expect(screen.getByText(`1 ${def.singular}`)).toBeTruthy()
  })

  it('edit: opens prefilled and saves the change, keeping id and created time', () => {
    seed(def, [{ title: 'Original', ...base }])
    render(<Harness def={def} />)
    fireEvent.click(button('Edit Original'))
    expect((screen.getByLabelText(titleLabel) as HTMLInputElement).value).toBe('Original')
    fill(titleLabel, 'Renamed')
    fireEvent.click(button('Save changes'))
    expect(saved(def)).toMatchObject([{ id: `${def.id}_0`, createdAt: '2026-10-01T09:00:00.000Z', title: 'Renamed' }])
    expect(button('Edit Renamed')).toBeTruthy()
  })

  it('delete: asks first, and "Keep it" backs out', () => {
    seed(def, [
      { title: 'Keep me', ...base },
      { title: 'Remove me', ...base },
    ])
    render(<Harness def={def} />)
    fireEvent.click(button('Edit Remove me'))
    fireEvent.click(button(`Delete ${def.singular}`))
    fireEvent.click(button('Keep it'))
    expect(saved(def)).toHaveLength(2)
    fireEvent.click(button(`Delete ${def.singular}`))
    fireEvent.click(button('Yes, delete'))
    expect(saved(def).map((i) => i.title)).toEqual(['Keep me'])
    expect(screen.queryByRole('button', { name: 'Edit Remove me' })).toBeNull()
  })
})

describe('Skills', () => {
  it('category takes a preset or free text; proficiency shows as the pill', () => {
    render(<Harness def={SKILLS} />)
    fireEvent.click(button('Add skill'))
    fill('Skill (required)', 'SQL')
    fireEvent.click(button('Data')) // preset
    fireEvent.click(screen.getByRole('radio', { name: 'Advanced' }))
    fill('Notes (optional)', 'Window functions')
    fireEvent.click(inSheet('Add skill'))
    expect(saved(SKILLS)).toMatchObject([{ title: 'SQL', category: 'Data', level: 'advanced', notes: 'Window functions' }])
    const card = button('Edit SQL')
    expect(card.textContent).toContain('Advanced')
    expect(card.textContent).toContain('Data')

    fireEvent.click(card)
    fill('Category (optional)', 'Query languages') // free text
    fireEvent.click(button('Save changes'))
    expect(saved(SKILLS)[0].category).toBe('Query languages')
  })
})

describe('Certs', () => {
  it('shows an Expired pill only on a cert whose expiry date has passed', () => {
    seed(CERTS, [
      { title: 'Old cert', issuer: 'Amazon', dateEarned: '2020-01-01', expiryDate: '2021-01-01' },
      { title: 'Current cert', expiryDate: '2099-01-01' },
      { title: 'Forever cert' },
    ])
    render(<Harness def={CERTS} />)
    expect(button('Edit Old cert').textContent).toContain('Expired')
    expect(button('Edit Current cert').textContent).not.toContain('Expired')
    expect(button('Edit Current cert').textContent).toContain('Expires Jan 1, 2099')
    expect(button('Edit Forever cert').textContent).not.toContain('Expire')
  })

  it('saves dates and a credential link, and refuses an expiry before the earned date', () => {
    render(<Harness def={CERTS} />)
    fireEvent.click(button('Add cert'))
    fill('Certification (required)', 'AWS Cloud Practitioner')
    fill('Issuing organization (optional)', 'Amazon')
    fill('Date earned (optional)', '2025-03-01')
    fill('Expiry date (optional)', '2024-03-01')
    fireEvent.click(inSheet('Add cert'))
    expect(screen.getByRole('alert').textContent).toBe("Expiry can't be before the date earned.")
    expect(saved(CERTS)).toEqual([])

    fill('Expiry date (optional)', '2099-03-01')
    fill('Credential link (optional)', 'aws.amazon.com/verify/abc')
    fireEvent.click(inSheet('Add cert'))
    expect(saved(CERTS)).toMatchObject([
      { issuer: 'Amazon', dateEarned: '2025-03-01', expiryDate: '2099-03-01', link: 'https://aws.amazon.com/verify/abc' },
    ])
    expect(screen.getByRole('link', { name: /View credential/ }).getAttribute('href')).toBe(
      'https://aws.amazon.com/verify/abc',
    )
  })
})

describe('Projects', () => {
  it('status shows as the pill and can be changed; the link opens from the card', () => {
    render(<Harness def={PROJECTS} />)
    fireEvent.click(button('Add project'))
    fill('Project (required)', 'Tracker app')
    fill('One-line description (optional)', 'Solo-Leveling habit PWA')
    fill('Link (optional)', 'github.com/pramod/tracker')
    fireEvent.click(inSheet('Add project'))
    expect(button('Edit Tracker app').textContent).toContain('Planning')
    expect(button('Edit Tracker app').textContent).toContain('Solo-Leveling habit PWA')
    expect(screen.getByRole('link', { name: /Open link/ }).getAttribute('href')).toBe(
      'https://github.com/pramod/tracker',
    )

    fireEvent.click(button('Edit Tracker app'))
    fireEvent.click(screen.getByRole('radio', { name: 'Paused' }))
    fireEvent.click(button('Save changes'))
    expect(saved(PROJECTS)[0].status).toBe('paused')
    expect(button('Edit Tracker app').textContent).toContain('Paused')
  })
})
