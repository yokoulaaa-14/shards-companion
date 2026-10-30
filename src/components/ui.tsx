import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center font-display font-bold uppercase tracking-[0.12em] rounded-md transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-paper text-ink hover:bg-white',
  secondary: 'border-2 border-paper/70 text-paper hover:bg-paper/10',
  ghost: 'border-2 border-dashed border-paper/40 text-paper/80 hover:bg-paper/10',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/** Square tap target for − / + steppers. */
export function Tap({ className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md border-2 border-line bg-panel-2 text-paper font-display text-xl font-bold active:bg-paper active:text-ink disabled:opacity-30 select-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted ${className}`}>{children}</span>
}
