import type { GoalStatus } from '../../lib/goals'

// Theme-aware status colours: neutral = not started, blue = in progress,
// green = done (the same blue/green Job Search uses for Applied/Offer).
export const GOAL_STATUS_PILL: Record<GoalStatus, string> = {
  not_started: 'border-border-strong bg-backing/50 text-text-secondary',
  in_progress: 'border-accent/50 bg-accent/15 text-accent-hover',
  done: 'border-success/50 bg-success/15 text-success',
}
