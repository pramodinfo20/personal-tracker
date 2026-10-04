// @vitest-environment jsdom
// The Job Search tracker running on the real hooks (useJobApplications +
// useHunter), so the quest checkbox is tested through the real claimQuest.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useHunter } from '../../hooks/useHunter'
import { useJobApplications } from '../../hooks/useJobApplications'
import { today } from '../../lib/format'
import { DEFAULT_HUNTER, type Hunter } from '../../lib/hunterState'
import {
  HUNT_QUEST_ID,
  huntQuest,
  localDateKey,
  type JobApplication,
} from '../../lib/jobApplications'
import { JobSearchScreen } from './JobSearchScreen'

function Harness() {
  const { hunter, claimQuest } = useHunter()
  const jobs = useJobApplications()
  return (
    <JobSearchScreen
      applications={jobs.applications}
      onAdd={jobs.addApplication}
      onUpdate={jobs.updateApplication}
      onDelete={jobs.deleteApplication}
      huntClaimedToday={Boolean(hunter.completedToday?.[HUNT_QUEST_ID])}
      onClaimHunt={(tier) => claimQuest(huntQuest(), tier)}
      onBack={() => {}}
    />
  )
}

const savedHunter = () => JSON.parse(localStorage.getItem('p26_hunter')!) as Hunter
const savedJobs = () => JSON.parse(localStorage.getItem('p26_job_applications') ?? '[]') as JobApplication[]
const huntEntries = () => savedHunter().log.filter((e) => e.questId === HUNT_QUEST_ID)

const seed = (hunter: Partial<Hunter> = {}, jobs: JobApplication[] = []) => {
  localStorage.setItem(
    'p26_hunter',
    JSON.stringify({ ...DEFAULT_HUNTER, name: 'Tester', lastQuestDate: today(), dailyXP: {}, ...hunter }),
  )
  localStorage.setItem('p26_job_applications', JSON.stringify(jobs))
}
const job = (over: Partial<JobApplication>): JobApplication => ({
  id: 'job_a',
  company: 'Siemens',
  role: 'Data Engineer',
  dateApplied: localDateKey(),
  status: 'applied',
  createdAt: '2026-10-05T09:00:00.000Z',
  ...over,
})

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const fill = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
const questBox = () => screen.getByRole('checkbox') as HTMLInputElement
const stat = (label: string) =>
  within(screen.getByLabelText('Applications sent')).getByText(label).previousSibling?.textContent

const addApplication = (company: string, { claim = false } = {}) => {
  fireEvent.click(button('Add application'))
  fill(/^Company/, company)
  if (claim) fireEvent.click(questBox())
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add application' }))
}

describe('JobSearchScreen', () => {
  beforeEach(() => seed())
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('starts empty, with zeroed stats', () => {
    render(<Harness />)
    expect(screen.getByText('No applications yet')).toBeTruthy()
    expect(stat('This week')).toBe('0')
    expect(stat('This month')).toBe('0')
  })

  it('add: company is required; the new card shows status and counts in the stats', () => {
    render(<Harness />)
    fireEvent.click(button('Add application'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add application' }))
    expect(screen.getByRole('alert').textContent).toBe('Company is required.')
    expect(savedJobs()).toEqual([])

    fill(/^Company/, 'Siemens')
    fill('Role', 'Data Engineer')
    fill(/^Link/, 'jobs.siemens.com/123')
    fill(/^Notes/, 'Referral from Anna')
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add application' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(savedJobs()).toMatchObject([
      {
        company: 'Siemens',
        role: 'Data Engineer',
        status: 'applied',
        dateApplied: localDateKey(),
        notes: 'Referral from Anna',
        link: 'https://jobs.siemens.com/123',
      },
    ])
    const card = button('Edit Siemens, Data Engineer')
    expect(card.textContent).toContain('Applied')
    expect(screen.getByRole('link', { name: /Open posting/ }).getAttribute('href')).toBe(
      'https://jobs.siemens.com/123',
    )
    expect(stat('This week')).toBe('1')
    expect(stat('This month')).toBe('1')
  })

  it('edit: tapping a card opens it prefilled; status and fields can be changed', () => {
    seed({}, [job({})])
    render(<Harness />)
    fireEvent.click(button('Edit Siemens, Data Engineer'))
    expect((screen.getByLabelText(/^Company/) as HTMLInputElement).value).toBe('Siemens')
    expect(screen.queryByRole('checkbox')).toBeNull() // the quest offer is for new applications only

    fireEvent.click(screen.getByRole('radio', { name: 'Interview' }))
    fill('Role', 'Senior Data Engineer')
    fireEvent.click(button('Save changes'))

    expect(savedJobs()).toMatchObject([
      { id: 'job_a', status: 'interview', role: 'Senior Data Engineer', createdAt: '2026-10-05T09:00:00.000Z' },
    ])
    expect(button('Edit Siemens, Senior Data Engineer').textContent).toContain('Interview')
  })

  it('delete: asks first, and "Keep it" backs out', () => {
    seed({}, [job({}), job({ id: 'job_b', company: 'Bosch', role: '' })])
    render(<Harness />)
    fireEvent.click(button('Edit Bosch'))
    fireEvent.click(button('Delete application'))
    fireEvent.click(button('Keep it'))
    expect(savedJobs()).toHaveLength(2)

    fireEvent.click(button('Delete application'))
    fireEvent.click(button('Yes, delete'))
    expect(savedJobs().map((a) => a.company)).toEqual(['Siemens'])
    expect(screen.queryByRole('button', { name: 'Edit Bosch' })).toBeNull()
  })

  it('lists newest first', () => {
    seed({}, [
      job({ id: 'old', company: 'Old Co', dateApplied: '2026-01-02' }),
      job({ id: 'new', company: 'New Co', dateApplied: '2026-09-30' }),
    ])
    render(<Harness />)
    const cards = screen.getAllByRole('button', { name: /^Edit / }).map((b) => b.getAttribute('aria-label'))
    expect(cards).toEqual(['Edit New Co, Data Engineer', 'Edit Old Co, Data Engineer'])
  })
})

describe('JobSearchScreen — Hunter Association quest checkbox', () => {
  beforeEach(() => seed())
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('is off by default: adding without it claims nothing', () => {
    render(<Harness />)
    addApplication('Siemens')
    expect(savedJobs()).toHaveLength(1)
    expect(huntEntries()).toEqual([])
    expect(savedHunter().completedToday[HUNT_QUEST_ID]).toBeUndefined()
  })

  it('checked: claims the quest once, through the normal claim, at the 1–2 actions tier', () => {
    render(<Harness />)
    const tier = huntQuest().tiers[0]
    fireEvent.click(button('Add application'))
    expect(screen.getByText(`+${tier.xp} XP · ${tier.label}`)).toBeTruthy()
    fill(/^Company/, 'Siemens')
    fireEvent.click(questBox())
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add application' }))

    const h = savedHunter()
    expect(h.completedToday[HUNT_QUEST_ID]).toBe(true)
    expect(h.xp).toBe(tier.xp)
    expect(huntEntries()).toMatchObject([{ xp: tier.xp, tier: tier.label, stat: 'PER', questId: HUNT_QUEST_ID }])
    expect(h.dailyXP[today()]).toBe(tier.xp)
  })

  it('does not double-claim: once claimed, the box is disabled and a second add grants nothing', () => {
    render(<Harness />)
    addApplication('Siemens', { claim: true })
    const xpAfterFirst = savedHunter().xp

    fireEvent.click(button('Add application'))
    expect(questBox().disabled).toBe(true)
    expect(questBox().checked).toBe(false)
    expect(screen.getByText('Already claimed today.')).toBeTruthy()
    fill(/^Company/, 'Bosch')
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add application' }))

    expect(savedJobs()).toHaveLength(2)
    expect(huntEntries()).toHaveLength(1)
    expect(savedHunter().xp).toBe(xpAfterFirst)
  })

  it('already claimed on Today: the box is disabled from the start', () => {
    seed({ completedToday: { [HUNT_QUEST_ID]: true } })
    render(<Harness />)
    fireEvent.click(button('Add application'))
    expect(questBox().disabled).toBe(true)
  })

  it('the tier follows how many applications are dated today', () => {
    seed({}, [job({ id: 'a' }), job({ id: 'b' })]) // two today already; this is the third action
    render(<Harness />)
    const tier = huntQuest().tiers[1]
    addApplication('Bosch', { claim: true })
    expect(huntEntries()).toMatchObject([{ xp: tier.xp, tier: tier.label }])
  })

  it('an invalid form claims nothing', () => {
    render(<Harness />)
    fireEvent.click(button('Add application'))
    fireEvent.click(questBox())
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add application' }))
    expect(savedJobs()).toEqual([])
    expect(huntEntries()).toEqual([])
  })
})
