import { cn } from '../../lib/cn'

export interface NestedBackButtonProps {
  onClick: () => void
  className?: string
}

export function NestedBackButton({ onClick, className }: NestedBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to More"
      className={cn(
        'hud-pressable inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-backing/50 px-3 pr-4 text-sm font-bold text-text-primary shadow-sm backdrop-blur-sm hover:border-accent/60',
        className,
      )}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        ‹
      </span>
      <span>More</span>
    </button>
  )
}
