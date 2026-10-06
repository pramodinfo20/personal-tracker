// Every motivational catchphrase in the app, in one place — grouped by the
// screen that shows it. Edit the wording here; components only reference
// these names. Keep each to one short line: they are polish alongside the
// functional text, never a replacement for it.

/** The intro splash a brand-new user sees before setup. */
export const INTRO_COPY = {
  eyebrow: 'System online',
  headline: 'Your journey begins now.',
  subline: 'Complete real-life quests to earn XP, grow stats, and level up.',
} as const

/** Setup flow: one line under each step's heading, plus the welcome shown once on first arriving at Today. */
export const ONBOARDING_COPY = {
  name: 'Every legend starts at Level 1.',
  body: 'This is your starting point, not your limit.',
  goals: 'Choose your path. These become real-life quests on Today.',
  complete: 'Your Hunter License is active. Time to level up.',
} as const

/** Level-up overlay, under the level and rank lines. */
export const LEVEL_UP_COPY = {
  encouragement: "You've grown stronger. Keep pushing forward.",
} as const

/** Today tab. */
export const TODAY_COPY = {
  /** Shown with the "No quests enabled" empty state. */
  emptyQuests: 'An empty board is just a fresh start.',
} as const

/** Manage Quests screen, under its title. */
export const MANAGE_QUESTS_COPY = {
  subtitle: 'Build the quest list that actually fits your life.',
} as const
