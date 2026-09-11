import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-sans text-sm font-semibold ' +
  'transition-all duration-150 ease-out active:scale-[0.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:pointer-events-none disabled:opacity-40'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover hover:shadow-glow-accent',
  secondary:
    'border border-border bg-surface text-text-primary hover:border-accent/60 hover:text-white hover:shadow-glow-accent',
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </button>
  )
}
