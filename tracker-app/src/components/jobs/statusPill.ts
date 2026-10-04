import type { JobStatus } from '../../lib/jobApplications'

// One colour per status, from the app's theme-aware tokens (so they hold up
// in light and dark): blue = in progress, gold = interview, green = offer,
// red = rejected.
export const STATUS_PILL: Record<JobStatus, string> = {
  applied: 'border-accent/50 bg-accent/15 text-accent-hover',
  interview: 'border-tier-gold/50 bg-tier-gold/15 text-tier-gold',
  offer: 'border-success/50 bg-success/15 text-success',
  rejected: 'border-tier-red/50 bg-tier-red/15 text-tier-red',
}
