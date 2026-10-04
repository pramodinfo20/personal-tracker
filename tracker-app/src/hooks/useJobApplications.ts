// The saved list of job applications — a sibling useSaved-backed list, same
// pattern as useCustomQuests. It only owns the records; claiming the Hunter
// Association quest alongside a new application is useHunter's claimQuest.

import {
  draftToFields,
  validateDraft,
  type JobApplication,
  type JobApplicationDraft,
} from '../lib/jobApplications'
import { useSaved } from './useSaved'

const JOB_APPLICATIONS_KEY = 'p26_job_applications'

const newId = (): string => `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
const isValid = (draft: JobApplicationDraft) => Object.keys(validateDraft(draft)).length === 0

export function useJobApplications() {
  const [applications, setApplications] = useSaved<JobApplication[]>(JOB_APPLICATIONS_KEY, [])

  // Returns the created application, or null for a draft that isn't valid.
  const addApplication = (draft: JobApplicationDraft): JobApplication | null => {
    if (!isValid(draft)) return null
    const created: JobApplication = {
      id: newId(),
      ...draftToFields(draft),
      createdAt: new Date().toISOString(),
    }
    setApplications((list) => [...list, created])
    return created
  }

  const updateApplication = (id: string, draft: JobApplicationDraft): boolean => {
    if (!isValid(draft)) return false
    setApplications((list) =>
      list.map((a) => (a.id === id ? { id: a.id, createdAt: a.createdAt, ...draftToFields(draft) } : a)),
    )
    return true
  }

  const deleteApplication = (id: string) => {
    setApplications((list) => list.filter((a) => a.id !== id))
  }

  return { applications, addApplication, updateApplication, deleteApplication }
}
