// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CustomQuest } from '../../lib/customQuests'
import { questEntries } from '../../lib/questVisibility'
import { DAILY_QUESTS } from '../../lib/quests'
import { ManageQuestsSheet } from './ManageQuestsSheet'

const water: CustomQuest = {
  id: 'cq_w',
  name: 'Drinking Water',
  category: 'hydration',
  iconKey: 'droplet',
  statKey: 'VIT',
  tiers: [{ label: '1L', xp: 15 }],
  active: true,
  activityId: 'water',
}

const setup = (hidden: string[] = [], custom: CustomQuest[] = [water]) => {
  const handlers = {
    onSetEnabled: vi.fn(),
    onAdd: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  }
  const entries = questEntries(hidden, custom)
  render(<ManageQuestsSheet entries={entries} completedToday={{}} {...handlers} />)
  return { handlers, entries }
}

const switchFor = (name: string) => screen.getByRole('switch', { name: `Show ${name} on Today` })

describe('ManageQuestsSheet', () => {
  afterEach(cleanup)

  it('lists every quest — the 5 built-ins and each custom quest — with a switch', () => {
    setup(['q_hunt'])
    expect(screen.getAllByRole('switch')).toHaveLength(DAILY_QUESTS.length + 1)
    expect(switchFor('Physical Training').getAttribute('aria-checked')).toBe('true')
    expect(switchFor('Hunter Association').getAttribute('aria-checked')).toBe('false')
    expect(switchFor('Drinking Water').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText(/5 of 6 shown/)).toBeTruthy()
  })

  it('toggling a built-in or a custom quest reports the same way: (entry, next state)', () => {
    const { handlers, entries } = setup()
    fireEvent.click(switchFor('Physical Training'))
    expect(handlers.onSetEnabled).toHaveBeenLastCalledWith(entries[0], false)
    fireEvent.click(switchFor('Drinking Water'))
    expect(handlers.onSetEnabled).toHaveBeenLastCalledWith(entries[5], false)
    expect(entries[0].kind).toBe('fixed')
    expect(entries[5].kind).toBe('custom')
  })

  it('turning a hidden quest back on reports enabled = true', () => {
    const { handlers, entries } = setup(['q_hunt'])
    fireEvent.click(switchFor('Hunter Association'))
    expect(handlers.onSetEnabled).toHaveBeenLastCalledWith(entries[2], true)
  })

  it('each custom quest has a visible Rename and Delete button; built-ins have neither', () => {
    setup()
    // Exactly one pair: built-ins can't be renamed or deleted.
    expect(screen.getAllByRole('button', { name: /^Rename / })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /^Delete / })).toHaveLength(1)
    const rename = screen.getByRole('button', { name: 'Rename Drinking Water' })
    expect(rename.textContent).toContain('Rename')
    for (const q of DAILY_QUESTS) {
      expect(screen.queryByRole('button', { name: `Rename ${q.label}` })).toBeNull()
    }
  })

  it('rename: opens prefilled, saves the trimmed name', () => {
    const { handlers } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Rename Drinking Water' }))
    const input = screen.getByLabelText('Quest name') as HTMLInputElement
    expect(input.value).toBe('Drinking Water')
    expect(input.maxLength).toBe(40)
    fireEvent.change(input, { target: { value: '  Hydrate  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(handlers.onRename).toHaveBeenCalledWith('cq_w', 'Hydrate')
    expect(screen.queryByLabelText('Quest name')).toBeNull()
  })

  it('rename: a blank name cannot be saved, and Cancel changes nothing', () => {
    const { handlers } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Rename Drinking Water' }))
    fireEvent.change(screen.getByLabelText('Quest name'), { target: { value: '   ' } })
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('A name is required.')).toBeTruthy()
    fireEvent.submit(screen.getByLabelText('Quest name').closest('form')!)
    expect(handlers.onRename).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByLabelText('Quest name')).toBeNull()
    expect(handlers.onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Rename Drinking Water' })).toBeTruthy()
  })

  it('delete still asks first', () => {
    const { handlers } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Drinking Water' }))
    expect(handlers.onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
    expect(handlers.onDelete).toHaveBeenCalledWith('cq_w')
  })

  it('"+ Add Quest" opens the activity library flow and saves by activity id', () => {
    const { handlers } = setup([], [])
    expect(screen.getByText(/No custom quests yet/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '+ Add Quest' }))
    const picker = screen.getByRole('dialog', { name: 'Add a quest' })
    fireEvent.click(within(picker).getByRole('button', { name: /Hydration/ }))
    fireEvent.click(within(picker).getByRole('button', { name: /Drinking Water/ }))
    fireEvent.click(within(picker).getByRole('button', { name: 'Add to My Quests' }))
    expect(handlers.onAdd).toHaveBeenCalledWith('water')
  })
})
