import { cn } from '../../lib/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name, e.g. "Show Physical Training on Today". */
  label: string
  className?: string
}

// A plain on/off toggle (role="switch"). The whole pill is the tap target;
// the knob slides with a transform, so toggling never shifts layout.
export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        checked
          ? 'border-accent bg-accent shadow-[0_0_10px_-2px_rgb(47_143_255/0.7)]'
          : 'border-border-strong bg-black/50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0.5 left-0.5 h-[1.375rem] w-[1.375rem] rounded-full bg-white shadow transition-transform duration-150',
          checked ? 'translate-x-5' : 'translate-x-0 opacity-70',
        )}
      />
    </button>
  )
}
