// Shared class strings for the tracker screens' forms and their "+" button
// (Job Search, Goals), so they stay identical.

// text-base (16px): anything smaller makes iOS Safari zoom the page in when
// the field is focused.
export const FIELD_CLASS =
  'w-full rounded-lg border border-border bg-backing/40 px-3 py-2 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none'

export const LABEL_CLASS = 'mb-1.5 block text-xs font-bold text-text-secondary'

/** The floating round "+" (same look as Today's log button). */
export const FAB_CLASS =
  'glow-accent fixed right-4 bottom-24 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(var(--rgb-accent-hover)),var(--color-accent)_55%,var(--color-accent-active))] text-3xl leading-none font-bold text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-8px_rgb(var(--rgb-shadow)/0.7),0_0_var(--hud-glow-spread)_rgb(var(--glow)/0.6)] transition-transform active:scale-95'
